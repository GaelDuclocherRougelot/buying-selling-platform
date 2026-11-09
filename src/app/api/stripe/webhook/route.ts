import { createPostHogServerClient } from "@/lib/posthog-server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
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

	console.log(`🔔 Event type: ${event.type}`);
	console.log(`🔔 Event ID: ${event.id}`);
	console.log(
		`🔔 Event created: ${new Date(event.created * 1000).toISOString()}`
	);
	console.log(`📋 Event data:`, JSON.stringify(event.data, null, 2));

	// Enregistrer le webhook dans les logs
	const object = event.data.object as
		| Stripe.Checkout.Session
		| Stripe.PaymentIntent
		| Stripe.PaymentMethod
		| Stripe.Account
		| { id?: string; object?: string };
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
				await capturePurchaseCompleted(
					event,
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

/**
 * Envoie purchase_completed à PostHog (côté serveur).
 * - uniquement si l'acheteur a accepté les cookies analytics
 *   (metadata.analyticsConsent posée à la création de la session Checkout)
 * - distinctId = id de l'acheteur uniquement (aucune donnée personnelle)
 * - uuid déterministe dérivé de l'event Stripe : les retries du webhook
 *   ne créent pas de doublon
 * - await shutdown() obligatoire en serverless (Vercel) pour flusher
 */
async function capturePurchaseCompleted(
	event: Stripe.Event,
	checkoutSession: Stripe.Checkout.Session
) {
	const { productId, buyerId, analyticsConsent, synthetic } =
		checkoutSession.metadata || {};
	if (analyticsConsent !== "true") return;
	if (!productId || !buyerId) return;
	if (checkoutSession.payment_status !== "paid") return;

	const posthog = createPostHogServerClient();
	if (!posthog) return;

	try {
		posthog.capture({
			distinctId: buyerId,
			event: "purchase_completed",
			uuid: deterministicUuid(`stripe:${checkoutSession.id}`),
			timestamp: new Date(event.created * 1000),
			properties: {
				listingId: productId,
				price: (checkoutSession.amount_total || 0) / 100,
				currency: checkoutSession.currency || "eur",
				// Achats du script de trafic synthétique : filtrables dans PostHog
				...(synthetic === "true" && {
					synthetic: true,
					source: "playwright",
				}),
				$process_person_profile: true,
			},
		});
	} catch (error) {
		console.error("❌ PostHog purchase_completed:", error);
	} finally {
		await posthog.shutdown();
	}
}

/** UUID (format v4) stable dérivé d'une chaîne. */
function deterministicUuid(input: string): string {
	const h = createHash("sha256").update(input).digest("hex");
	const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
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

				// Récupérer le PaymentIntent pour obtenir le vrai application_fee_amount
				let applicationFeeAmount =
					existingPayment.applicationFeeAmount || 0;
				try {
					const paymentIntent = await stripe.paymentIntents.retrieve(
						checkoutSession.payment_intent as string
					);
					applicationFeeAmount =
						(paymentIntent.application_fee_amount || 0) / 100; // Convert to euros
					console.log(
						`💰 Commission mise à jour: ${applicationFeeAmount}€`
					);
				} catch (error) {
					console.error(
						"❌ Erreur récupération PaymentIntent:",
						error
					);
				}

				// Mettre à jour le paiement existant - EN ATTENTE DE VALIDATION
				await prisma.payment.update({
					where: {
						stripePaymentIntentId:
							checkoutSession.payment_intent as string,
					},
					data: {
						status: "pending_shipping_validation", // ⚠️ BLOQUÉ jusqu'à validation
						applicationFeeAmount: applicationFeeAmount, // ✅ Mettre à jour la commission
						updatedAt: new Date(),
					},
				});
				console.log(
					`📝 Paiement mis à jour (en attente de validation): ${checkoutSession.payment_intent}`
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
					// Récupérer le produit pour connaître le type de livraison
					const product = await prisma.product.findUnique({
						where: { id: productId },
						select: { delivery: true },
					});

					// Récupérer le PaymentIntent pour obtenir le vrai application_fee_amount
					let applicationFeeAmount = 0;
					try {
						const paymentIntent =
							await stripe.paymentIntents.retrieve(
								checkoutSession.payment_intent as string
							);
						applicationFeeAmount =
							(paymentIntent.application_fee_amount || 0) / 100; // Convert to euros
						console.log(
							`💰 Commission calculée: ${applicationFeeAmount}€`
						);
					} catch (error) {
						console.error(
							"❌ Erreur récupération PaymentIntent:",
							error
						);
					}

					// Déterminer le statut selon le type de livraison
					let paymentStatus = "pending_shipping_validation"; // Par défaut pour pickup/delivery
					if (product?.delivery === "in-person") {
						paymentStatus = "pending_buyer_validation"; // Pour remise en main propre
						console.log(
							`🤝 Livraison in-person détectée, en attente de validation acheteur`
						);
					} else {
						console.log(
							`📦 Livraison ${product?.delivery} détectée, en attente de preuves d'expédition`
						);
					}

					await prisma.payment.create({
						data: {
							stripePaymentIntentId:
								checkoutSession.payment_intent as string,
							amount: (checkoutSession.amount_total || 0) / 100, // Convert from cents
							currency: "eur",
							status: paymentStatus, // ✅ Statut adapté au type de livraison
							productId: productId,
							buyerId: buyerId,
							sellerId: sellerId,
							applicationFeeAmount: applicationFeeAmount, // ✅ VRAIE commission
						},
					});
					console.log(
						`📝 Nouveau paiement créé (en attente de validation): ${checkoutSession.payment_intent}`
					);
				} else {
					console.log(
						`⚠️ Métadonnées manquantes pour créer le paiement: productId=${productId}, buyerId=${buyerId}, sellerId=${sellerId}`
					);
				}
			}

			// ⚠️ Marquer le produit selon le type de livraison
			const { productId } = checkoutSession.metadata || {};

			if (productId) {
				try {
					// Récupérer le type de livraison du produit
					const product = await prisma.product.findUnique({
						where: { id: productId },
						select: { delivery: true },
					});

					const productStatus = "pending_shipping_validation"; // Par défaut
					if (product?.delivery === "in-person") {
						return;
					} 

					await prisma.product.update({
						where: { id: productId },
						data: { status: productStatus },
					});
					console.log(`📋 Produit marqué comme: ${productStatus}`);
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
				`📝 Paiement non trouvé en base, création d'un nouveau...`
			);
			console.log(`💰 Montant: ${paymentIntent.amount / 100}€`);
			console.log(`💳 ID: ${paymentIntent.id}`);

			// Extraire les métadonnées du payment intent
			const { productId, buyerId, sellerId } =
				paymentIntent.metadata || {};

			if (productId && buyerId && sellerId) {
				try {
					// Récupérer le produit pour connaître le type de livraison
					const product = await prisma.product.findUnique({
						where: { id: productId },
						select: { delivery: true },
					});

					// Calculer le vrai application_fee_amount depuis Stripe
					const applicationFeeAmount =
						(paymentIntent.application_fee_amount || 0) / 100; // Convert to euros
					console.log(
						`💰 Commission sur PaymentIntent: ${applicationFeeAmount}€`
					);

					// Déterminer le statut selon le type de livraison
					const paymentStatus = "pending_shipping_validation"; // Par défaut
					if (product?.delivery === "in-person") {
						return;
					} 

					// Vérifier une seconde fois si le paiement n'existe pas déjà
					// (protection contre les conditions de course)
					const doubleCheckPayment = await prisma.payment.findUnique({
						where: { stripePaymentIntentId: paymentIntent.id },
					});

					if (doubleCheckPayment) {
						console.log(
							`⚠️ Paiement créé entre-temps, mise à jour au lieu de création`
						);
						await prisma.payment.update({
							where: { stripePaymentIntentId: paymentIntent.id },
							data: {
								status: paymentStatus,
								applicationFeeAmount: applicationFeeAmount,
								updatedAt: new Date(),
							},
						});
					} else {
						await prisma.payment.create({
							data: {
								stripePaymentIntentId: paymentIntent.id,
								amount: paymentIntent.amount / 100, // Convert from cents
								currency: paymentIntent.currency,
								status: paymentStatus, // ✅ Statut adapté au type de livraison
								productId: productId,
								buyerId: buyerId,
								sellerId: sellerId,
								applicationFeeAmount: applicationFeeAmount, // ✅ VRAIE commission depuis Stripe
							},
						});
						console.log(
							`📝 Nouveau paiement créé (en attente de validation): ${paymentIntent.id}`
						);
					}
				} catch (createError) {
					console.error(
						`❌ Erreur lors de la création du paiement:`,
						createError
					);
				}
			} else {
				console.log(
					`⚠️ Métadonnées manquantes pour créer le paiement: productId=${productId}, buyerId=${buyerId}, sellerId=${sellerId}`
				);
			}
		} else {
			// ⚠️ NE PAS changer le statut s'il est déjà en attente de validation
			// Mais mettre à jour la commission si nécessaire
			const applicationFeeAmount =
				(paymentIntent.application_fee_amount || 0) / 100; // Convert to euros
			console.log(
				`💰 Commission existante à vérifier: ${applicationFeeAmount}€`
			);

			// ✅ CORRECTION : Ne pas changer le statut automatiquement
			// Le statut doit rester "pending_shipping_validation" jusqu'à validation des preuves
			if (existingPayment.applicationFeeAmount !== applicationFeeAmount) {
				await prisma.payment.update({
					where: { stripePaymentIntentId: paymentIntent.id },
					data: {
						// ❌ NE PAS changer le statut : existingPayment.status
						applicationFeeAmount: applicationFeeAmount, // ✅ Mettre à jour seulement la commission
						updatedAt: new Date(),
					},
				});
				console.log(
					`📝 Paiement existant mis à jour (commission uniquement): ${paymentIntent.id}`
				);
			} else {
				console.log(
					`📝 Paiement déjà en attente de validation avec bonne commission, pas de changement: ${paymentIntent.id}`
				);
			}
		}

		// Marquer le produit selon le type de livraison
		const { productId } = paymentIntent.metadata || {};
		if (productId) {
			try {
				// Récupérer le type de livraison du produit
				const product = await prisma.product.findUnique({
					where: { id: productId },
					select: { delivery: true },
				});

				let productStatus = "pending_shipping_validation"; // Par défaut
				if (product?.delivery === "in-person") {
					productStatus = "pending_buyer_validation";
					console.log(
						`⏳ Produit PaymentIntent en attente de validation acheteur: ${productId}`
					);
				} else {
					console.log(
						`⏳ Produit PaymentIntent en attente de validation d'expédition: ${productId}`
					);
				}

				await prisma.product.update({
					where: { id: productId },
					data: { status: productStatus },
				});
				console.log(`📋 Produit marqué comme: ${productStatus}`);
			} catch (productError) {
				console.error(
					`❌ Erreur lors de la mise à jour du produit:`,
					productError
				);
			}
		} else {
			console.log(`⚠️ Aucun productId trouvé dans les métadonnées`);
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
