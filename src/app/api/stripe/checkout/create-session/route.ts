import { auth } from "@/lib/auth";
import {
	ANALYTICS_CONSENT_COOKIE,
	isAnalyticsConsentCookie,
	SYNTHETIC_TRAFFIC_COOKIE,
} from "@/lib/consent";
import {
	calculatePlatformFee,
	getPlatformFeeInCents,
	getSellerSalesCount,
} from "@/lib/platform-fees";
import { prepareCheckout } from "@/lib/checkout";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/stripe/checkout/create-session:
 *   post:
 *     summary: Créer une session de paiement Stripe
 *     description: Crée une session de paiement Stripe pour l'achat d'un produit
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID du produit à acheter
 *                 example: "product_123"
 *               amount:
 *                 type: number
 *                 description: Ignoré. Le montant est calculé côté serveur (offre acceptée de l'acheteur, sinon prix du produit, plus frais de port)
 *                 example: 59.99
 *               productTitle:
 *                 type: string
 *                 description: Titre du produit pour la description du paiement
 *                 example: "Chaise design"
 *     responses:
 *       200:
 *         description: Session de paiement créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: ID de la session Stripe
 *                 url:
 *                   type: string
 *                   description: URL de la page de paiement Stripe
 *       400:
 *         description: Produit déjà vendu ou indisponible, paiement en cours, auto-achat, ou vendeur non configuré
 *       403:
 *         description: Produit réservé à l'acheteur d'une offre acceptée
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Produit non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */

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

		const body = await request.json();
		// `amount` envoyé par le client est ignoré : montant calculé côté serveur
		const { productId, productTitle } = body;

		const checkout = await prepareCheckout(
			request,
			productId,
			session.user.id
		);
		if (checkout instanceof NextResponse) return checkout;
		const { product, stripeAccountId, itemPrice, amount } = checkout;

		// 🎯 Calculate platform fee with progressive system (sur le prix de l'article)
		const sellerSalesCount = await getSellerSalesCount(product.ownerId);
		const feeInfo = calculatePlatformFee(itemPrice, {
			category: product.category?.name?.toLowerCase(),
			sellerSalesCount: sellerSalesCount,
		});
		const platformFeeAmount = getPlatformFeeInCents(itemPrice, {
			category: product.category?.name?.toLowerCase(),
			sellerSalesCount: sellerSalesCount,
		});

		console.log(`💰 Commission calculée pour vendeur ${product.ownerId}:`);
		console.log(`   📊 Ventes réalisées: ${sellerSalesCount}`);
		console.log(`   💳 ${feeInfo.breakdown} = ${feeInfo.feeAmount}€`);

		// Create Stripe Checkout session
		const checkoutSession = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "eur",
						product_data: {
							name: productTitle || product.title,
							description: product.description || undefined,
						},
						unit_amount: Math.round(amount * 100), // Convert to cents
					},
					quantity: 1,
				},
			],
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile?payment=cancelled`,
			metadata: {
				productId,
				buyerId: session.user.id,
				sellerId: product.ownerId,
				// Consentement analytics de l'acheteur, relu par le webhook (purchase_completed)
				analyticsConsent: isAnalyticsConsentCookie(
					request.cookies.get(ANALYTICS_CONSENT_COOKIE)?.value
				)
					? "true"
					: "false",
				// Trafic synthétique (scripts/synthetic-sessions.ts) : marque purchase_completed
				synthetic:
					request.cookies.get(SYNTHETIC_TRAFFIC_COOKIE)?.value === "1"
						? "true"
						: "false",
			},
			// Pour Stripe Connect, ajouter les frais de plateforme
			payment_intent_data: {
				capture_method: "manual",
				application_fee_amount: platformFeeAmount,
				transfer_data: {
					destination: stripeAccountId,
				},
			},
		});

		console.log("checkoutSession", checkoutSession);

		// Note: payment_intent will be null at this stage
		// The payment record will be created when the webhook is received
		console.log(
			"ℹ️ payment_intent is null at session creation (normal behavior)"
		);

		// Option: Create payment record with session ID as temporary reference
		// await prisma.payment.create({
		// 	data: {
		// 		stripePaymentIntentId: checkoutSession.id,
		// 		amount: amount,
		// 		currency: "eur",
		// 		status: "waiting_payment",
		// 		productId: productId,
		// 		buyerId: session.user.id,
		// 		sellerId: product.ownerId,
		// 		applicationFeeAmount: platformFeeAmount / 100,
		// 	},
		// });

		return NextResponse.json({
			sessionId: checkoutSession.id,
			url: checkoutSession.url,
		});
	} catch (error) {
		console.error("Error creating checkout session:", error);
		return NextResponse.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 }
		);
	}
}
