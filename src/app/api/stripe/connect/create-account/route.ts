import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
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

		// Check if user already has a Stripe account
		const existingUser = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { stripeAccountId: true },
		});

		if (existingUser?.stripeAccountId) {
			return NextResponse.json(
				{ error: "User already has a Stripe account" },
				{ status: 400 }
			);
		}

		// Créer le compte Stripe Express (plus simple pour les utilisateurs)
		const accountData: Stripe.AccountCreateParams = {
			type: "express", // Retour à Express pour une meilleure UX
			country: "FR",
			email: session.user.email,
			capabilities: {
				card_payments: { requested: true },
				transfers: { requested: true },
			},
			business_type: "individual",
		};

		console.log("Creating Stripe Express account with data:", accountData);

		let account: Stripe.Account;
		try {
			// Create Stripe Connect account
			account = await stripe.accounts.create(accountData);
			console.log("✅ Stripe account created successfully:", account.id);
		} catch (stripeError) {
			console.error("❌ Stripe account creation failed:", stripeError);

			// Gérer spécifiquement l'erreur de profil plateforme
			if (
				stripeError &&
				typeof stripeError === "object" &&
				"message" in stripeError &&
				typeof stripeError.message === "string" &&
				(stripeError.message.includes(
					"responsibilities of managing losses"
				) ||
					stripeError.message.includes("platform profile"))
			) {
				return NextResponse.json(
					{
						error: "PLATFORM_PROFILE_REQUIRED",
						message: "Configuration du profil plateforme requise",
						details:
							"Vous devez configurer votre profil de plateforme Stripe Connect avant de créer des comptes vendeurs.",
						instructions: [
							"1. Allez sur dashboard.stripe.com",
							"2. Naviguez vers Connect > Settings",
							"3. Complétez le profil de la plateforme",
							"4. Acceptez les responsabilités de gestion des pertes",
							"5. Réessayez de créer un compte vendeur",
						],
					},
					{ status: 500 }
				);
			}

			// Autres erreurs Stripe
			return NextResponse.json(
				{
					error: "STRIPE_ERROR",
					message:
						stripeError instanceof Error
							? stripeError.message
							: "Failed to create Stripe account",
				},
				{ status: 500 }
			);
		}

		// Vérifier que l'ID du compte est valide (doit commencer par acct_)
		if (!account.id || !account.id.startsWith("acct_")) {
			console.error("❌ Invalid Stripe account ID:", account.id);
			return NextResponse.json(
				{ error: "Invalid Stripe account ID" },
				{ status: 500 }
			);
		}

		// Update user with Stripe account ID
		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				stripeAccountId: account.id,
				stripeAccountStatus: account.charges_enabled
					? "active"
					: "pending",
			},
		});

		console.log(
			`✅ Compte Stripe Express créé pour ${session.user.email}: ${account.id}`
		);

		return NextResponse.json({
			accountId: account.id,
			status: account.charges_enabled ? "active" : "pending",
			needsOnboarding: !account.charges_enabled,
		});
	} catch (error) {
		console.error("Error creating Stripe Connect account:", error);

		return NextResponse.json(
			{ error: "Failed to create Stripe account" },
			{ status: 500 }
		);
	}
}
