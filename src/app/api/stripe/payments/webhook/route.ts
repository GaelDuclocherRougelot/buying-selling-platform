import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
	const body = await request.text();
	const signature = request.headers.get("stripe-signature");

	if (!signature) {
		console.error("Missing stripe signature");
		return NextResponse.json(
			{ error: "Missing stripe signature" },
			{ status: 400 }
		);
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET!
		);
	} catch (error) {
		console.error("Webhook signature verification failed:", error);
		return NextResponse.json(
			{ error: "Invalid signature" },
			{ status: 400 }
		);
	}

	console.log(`🔔 Webhook reçu: ${event.type}`);

	try {
		switch (event.type) {
			case "checkout.session.completed":
				await handleCheckoutSessionCompleted(
					event.data.object as Stripe.Checkout.Session
				);
				break;

			case "payment_intent.succeeded":
				await handlePaymentIntentSucceeded(
					event.data.object as Stripe.PaymentIntent
				);
				break;

			case "payment_intent.payment_failed":
				await handlePaymentIntentFailed(
					event.data.object as Stripe.PaymentIntent
				);
				break;

			case "account.updated":
				await handleAccountUpdated(event.data.object as Stripe.Account);
				break;

			case "charge.succeeded":
			case "payment_intent.created":
			case "charge.updated":
				// Événements non gérés pour le moment
				console.log(`ℹ️ Événement non géré: ${event.type}`);
				break;

			default:
				console.log(`⚠️ Événement inconnu: ${event.type}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error("❌ Erreur webhook:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}

async function handleCheckoutSessionCompleted(
	checkoutSession: Stripe.Checkout.Session
) {
	console.log(`✅ Session Checkout complétée: ${checkoutSession.id}`);
	console.log(`📋 Métadonnées:`, checkoutSession.metadata);

	try {
		// Mettre à jour le paiement en base
		if (checkoutSession.payment_intent) {
			// Vérifier si le paiement existe déjà
			const existingPayment = await prisma.payment.findUnique({
				where: {
					stripePaymentIntentId:
						checkoutSession.payment_intent as string,
				},
			});

			if (existingPayment) {
				// Mettre à jour le paiement existant
				await prisma.payment.update({
					where: {
						stripePaymentIntentId:
							checkoutSession.payment_intent as string,
					},
					data: {
						status: "succeeded",
						updatedAt: new Date(),
					},
				});
				console.log(
					`📝 Paiement mis à jour: ${checkoutSession.payment_intent}`
				);
			} else {
				// Créer un nouveau paiement si il n'existe pas
				const { productId, buyerId, sellerId } =
					checkoutSession.metadata || {};

				if (productId && buyerId && sellerId) {
					await prisma.payment.create({
						data: {
							stripePaymentIntentId:
								checkoutSession.payment_intent as string,
							amount: (checkoutSession.amount_total || 0) / 100, // Convert from cents
							currency: "eur",
							status: "succeeded",
							productId: productId,
							buyerId: buyerId,
							sellerId: sellerId,
							applicationFeeAmount: 0, // Will be calculated from payment intent if needed
						},
					});
					console.log(
						`📝 Nouveau paiement créé: ${checkoutSession.payment_intent}`
					);
				} else {
					console.log(
						`⚠️ Métadonnées manquantes pour créer le paiement`
					);
				}
			}
		}
	} catch (error) {
		console.error(`❌ Erreur lors du traitement de la session:`, error);
	}
}

async function handlePaymentIntentSucceeded(
	paymentIntent: Stripe.PaymentIntent
) {
	console.log(`✅ Paiement réussi: ${paymentIntent.id}`);
	console.log(`📋 Métadonnées:`, paymentIntent.metadata);

	try {
		const existingPayment = await prisma.payment.findUnique({
			where: { stripePaymentIntentId: paymentIntent.id },
		});

		if (!existingPayment) {
			console.log(
				`ℹ️ Paiement de test reçu (données non créées en base)`
			);
			console.log(` Montant: ${paymentIntent.amount / 100}€`);
			console.log(`💳 ID: ${paymentIntent.id}`);
			// En production, le paiement sera créé avec de vraies données
		} else {
			await prisma.payment.update({
				where: { stripePaymentIntentId: paymentIntent.id },
				data: {
					status: "succeeded",
					updatedAt: new Date(),
				},
			});
			console.log(`📝 Paiement mis à jour: ${paymentIntent.id}`);
		}
	} catch (error) {
		console.error(`❌ Erreur:`, error);
		// Ne pas throw pour éviter que Stripe réessaie
	}
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
	console.log(`❌ Paiement échoué: ${paymentIntent.id}`);

	try {
		const existingPayment = await prisma.payment.findUnique({
			where: { stripePaymentIntentId: paymentIntent.id },
		});

		if (existingPayment) {
			await prisma.payment.update({
				where: { stripePaymentIntentId: paymentIntent.id },
				data: {
					status: "failed",
					updatedAt: new Date(),
				},
			});
		} else {
			console.log(
				`⚠️ Paiement échoué non trouvé en base: ${paymentIntent.id}`
			);
		}
	} catch (error) {
		console.error(`❌ Erreur lors du traitement de l'échec:`, error);
	}
}

async function handleAccountUpdated(account: Stripe.Account) {
	console.log(` Compte mis à jour: ${account.id}`);

	try {
		await prisma.user.update({
			where: { stripeAccountId: account.id },
			data: {
				stripeAccountStatus: account.charges_enabled
					? "active"
					: "pending",
			},
		});
		console.log(
			`✅ Statut du compte mis à jour: ${account.charges_enabled ? "actif" : "en attente"}`
		);
	} catch (error) {
		console.error(`❌ Erreur lors de la mise à jour du compte:`, error);
	}
}
