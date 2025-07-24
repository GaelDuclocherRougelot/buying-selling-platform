import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Fonction simple pour logger les webhooks (évite les problèmes d'import)
function logWebhookEvent(
	eventType: string,
	eventId: string,
	status: string,
	details: Record<string, unknown>
) {
	console.log(
		`📝 Webhook Log - ${eventType} (${eventId}): ${status}`,
		details
	);
}

export async function POST(request: NextRequest) {
	const body = await request.text();
	const signature = request.headers.get("stripe-signature");

	console.log(
		"🔔 Webhook reçu - Headers:",
		Object.fromEntries(request.headers.entries())
	);
	console.log("🔔 Webhook reçu - Body length:", body.length);

	if (!signature) {
		console.error("❌ Missing stripe signature");
		return NextResponse.json(
			{ error: "Missing stripe signature" },
			{ status: 400 }
		);
	}

	if (!process.env.STRIPE_WEBHOOK_SECRET) {
		console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
		return NextResponse.json(
			{ error: "Webhook secret not configured" },
			{ status: 500 }
		);
	}

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET
		);
		console.log("✅ Webhook signature verified successfully");
	} catch (error) {
		console.error("❌ Webhook signature verification failed:", error);
		return NextResponse.json(
			{ error: "Invalid signature" },
			{ status: 400 }
		);
	}

	console.log(`🔔 Webhook reçu: ${event.type}`);
	console.log(`📋 Event data:`, JSON.stringify(event.data, null, 2));

	// Enregistrer le webhook dans les logs
	const object = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent | Stripe.PaymentMethod | Stripe.Account | { id?: string; object?: string };
	logWebhookEvent(event.type, event.id, "received", {
		objectId: object.id,
		objectType: object.object,
		livemode: event.livemode,
	});

	try {
		switch (event.type) {
			case "checkout.session.completed":
				console.log("🛒 Traitement de checkout.session.completed");
				await handleCheckoutSessionCompleted(
					event.data.object as Stripe.Checkout.Session
				);
				break;

			case "payment_intent.succeeded":
				console.log("💳 Traitement de payment_intent.succeeded");
				await handlePaymentIntentSucceeded(
					event.data.object as Stripe.PaymentIntent
				);
				break;

			case "payment_intent.payment_failed":
				console.log("❌ Traitement de payment_intent.payment_failed");
				await handlePaymentIntentFailed(
					event.data.object as Stripe.PaymentIntent
				);
				break;

			case "payment_method.attached":
			case "payment_method.updated":
			case "payment_method.detached":
				console.log(`💳 Événement payment_method reçu: ${event.type}`);
				console.log(
					`📋 Payment Method ID: ${(event.data.object as Stripe.PaymentMethod).id}`
				);
				console.log(
					`👤 Customer: ${(event.data.object as Stripe.PaymentMethod).customer || "Aucun"}`
				);
				// Ces événements ne nécessitent pas de traitement spécial pour notre logique métier
				break;

			case "account.updated":
				console.log("👤 Traitement de account.updated");
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
				console.log(
					`📋 Objet reçu:`,
					JSON.stringify(event.data.object, null, 2)
				);
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
	console.log(`💰 Montant total:`, checkoutSession.amount_total);
	console.log(`💳 Payment Intent ID:`, checkoutSession.payment_intent);

	try {
		// Mettre à jour le paiement en base
		if (checkoutSession.payment_intent) {
			console.log(
				`🔍 Recherche du paiement existant: ${checkoutSession.payment_intent}`
			);

			// Vérifier si le paiement existe déjà
			const existingPayment = await prisma.payment.findUnique({
				where: {
					stripePaymentIntentId:
						checkoutSession.payment_intent as string,
				},
			});

			if (existingPayment) {
				console.log(`📝 Paiement existant trouvé, mise à jour...`);
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
				console.log(
					`📝 Aucun paiement existant trouvé, création d'un nouveau...`
				);
				// Créer un nouveau paiement si il n'existe pas
				const { productId, buyerId, sellerId } =
					checkoutSession.metadata || {};

				console.log(`📋 Métadonnées extraites:`, {
					productId,
					buyerId,
					sellerId,
				});

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
						`⚠️ Métadonnées manquantes pour créer le paiement: productId=${productId}, buyerId=${buyerId}, sellerId=${sellerId}`
					);
				}
			}

			// Marquer le produit comme vendu
			const { productId } = checkoutSession.metadata || {};
			console.log(
				`🏷️ Tentative de marquage du produit comme vendu: ${productId}`
			);

			if (productId) {
				try {
					const updatedProduct = await prisma.product.update({
						where: { id: productId },
						data: { status: "sold" },
					});
					console.log(
						`🏷️ Produit marqué comme vendu avec succès: ${productId}`
					);
					console.log(`📋 Produit mis à jour:`, updatedProduct);
				} catch (productError) {
					console.error(
						`❌ Erreur lors de la mise à jour du produit:`,
						productError
					);
				}
			} else {
				console.log(`⚠️ Aucun productId trouvé dans les métadonnées`);
			}
		} else {
			console.log(`⚠️ Aucun payment_intent trouvé dans la session`);
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

			// Marquer le produit comme vendu
			const { productId } = paymentIntent.metadata || {};
			if (productId) {
				await prisma.product.update({
					where: { id: productId },
					data: { status: "sold" },
				});
				console.log(`🏷️ Produit marqué comme vendu: ${productId}`);
			}
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
