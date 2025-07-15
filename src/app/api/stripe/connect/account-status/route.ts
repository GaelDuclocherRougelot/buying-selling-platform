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

		// Update local status
		const status = account.charges_enabled ? "active" : "pending";
		if (status !== user.stripeAccountStatus) {
			await prisma.user.update({
				where: { id: session.user.id },
				data: { stripeAccountStatus: status },
			});
		}

		return NextResponse.json({
			accountId: account.id,
			status: status,
			chargesEnabled: account.charges_enabled,
			payoutsEnabled: account.payouts_enabled,
			requirements: account.requirements,
		});
	} catch (error) {
		console.error("Error retrieving account status:", error);
		return NextResponse.json(
			{ error: "Failed to retrieve account status" },
			{ status: 500 }
		);
	}
}
