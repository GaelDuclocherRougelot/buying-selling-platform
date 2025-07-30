import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { stripeAccountId: true, stripeAccountStatus: true },
		});

		if (!user?.stripeAccountId) {
			return NextResponse.json(
				{ error: "No Stripe account found" },
				{ status: 404 }
			);
		}

		// Get account details from Stripe
		const account = await stripe.accounts.retrieve(user.stripeAccountId);

		// Vérifier les conditions pour un compte actif
		const chargesEnabled = account.charges_enabled;
		const payoutsEnabled = account.payouts_enabled;
		const detailsSubmitted = account.details_submitted;
		const requirements = account.requirements;

		// Déterminer le statut basé sur plusieurs critères
		let status = "pending";
		if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
			status = "active";
		} else if (chargesEnabled && detailsSubmitted) {
			status = "charges_only";
		}

		// Mettre à jour le statut local si différent
		if (status !== user.stripeAccountStatus) {
			await prisma.user.update({
				where: { id: session.user.id },
				data: { stripeAccountStatus: status },
			});
		}

		// Analyser les exigences manquantes
		const missingRequirements: string[] = [];
		if (requirements?.currently_due) {
			Object.keys(requirements.currently_due).forEach((key) => {
				missingRequirements.push(key);
			});
		}

		return NextResponse.json({
			accountId: account.id,
			status: status,
			chargesEnabled: chargesEnabled,
			payoutsEnabled: payoutsEnabled,
			detailsSubmitted: detailsSubmitted,
			requirements: requirements,
			missingRequirements: missingRequirements,
			canSell: status === "active" || status === "charges_only",
		});
	} catch (error) {
		console.error("Error retrieving account status:", error);
		return NextResponse.json(
			{ error: "Failed to retrieve account status" },
			{ status: 500 }
		);
	}
}
