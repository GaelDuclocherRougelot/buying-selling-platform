import { getBaseURL } from "@/lib/api";
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
import { prisma } from "@/lib/prisma";
import { securityLog } from "@/lib/security-log";
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
 *               - productTitle
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID du produit à acheter
 *                 example: "product_123"
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
 *         description: Produit déjà vendu, paiement en cours, ou vendeur non configuré
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Produit réservé à un autre acheteur
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
		// Le montant envoyé par le client est ignoré : il est calculé côté serveur
		const { productId, productTitle } = body;

		// Get product and seller information
		const product = await prisma.product.findUnique({
			where: { id: productId },
			include: {
				owner: {
					select: { stripeAccountId: true },
				},
				category: {
					select: { name: true },
				},
			},
		});

		if (!product) {
			return NextResponse.json(
				{ error: "Product not found" },
				{ status: 404 }
			);
		}

		// Vérifier que le produit n'est pas déjà vendu
		if (product.status === "sold") {
			return NextResponse.json(
				{ error: "Ce produit a déjà été vendu" },
				{ status: 400 }
			);
		}

		if (product.status !== "active" && product.status !== "waiting_payment") {
			return NextResponse.json(
				{ error: "Ce produit n'est pas disponible à l'achat" },
				{ status: 400 }
			);
		}

		// Offre acceptée de cet acheteur pour ce produit
		const acceptedOffer = await prisma.offer.findFirst({
			where: {
				status: "accepted",
				conversation: { productId, buyerId: session.user.id },
			},
			orderBy: { updatedAt: "desc" },
		});

		// Produit réservé : seul l'acheteur dont l'offre a été acceptée peut payer
		if (product.status === "waiting_payment" && !acceptedOffer) {
			await securityLog("authz.denied", request.headers, {
				userId: session.user.id,
				path: request.nextUrl.pathname,
				method: "POST",
				resource: "product",
				resourceId: productId,
			});
			return NextResponse.json(
				{ error: "Ce produit est réservé à un autre acheteur" },
				{ status: 403 }
			);
		}

		const amount = acceptedOffer ? acceptedOffer.amount : product.price;

		// Vérifier qu'il n'y a pas déjà un paiement en cours pour ce produit
		const existingPayment = await prisma.payment.findFirst({
			where: {
				productId: productId,
				status: {
					in: [
						"pending",
						"pending_shipping_validation",
						"pending_buyer_validation",
						"succeeded",
					],
				},
			},
		});

		if (existingPayment) {
			return NextResponse.json(
				{
					error: "Ce produit est en cours d'achat par un autre utilisateur",
				},
				{ status: 400 }
			);
		}

		// Vérifier que l'acheteur n'est pas le vendeur
		if (product.ownerId === session.user.id) {
			return NextResponse.json(
				{ error: "Vous ne pouvez pas acheter votre propre produit" },
				{ status: 400 }
			);
		}

		if (!product.owner.stripeAccountId) {
			return NextResponse.json(
				{ error: "Seller has not set up payments" },
				{ status: 400 }
			);
		}

		// 🎯 Calculate platform fee with progressive system
		const sellerSalesCount = await getSellerSalesCount(product.ownerId);
		const feeInfo = calculatePlatformFee(amount, {
			category: product.category?.name?.toLowerCase(),
			sellerSalesCount: sellerSalesCount,
		});
		const platformFeeAmount = getPlatformFeeInCents(amount, {
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
			success_url: `${getBaseURL()}/auth/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${getBaseURL()}/auth/profile?payment=cancelled`,
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
					destination: product.owner.stripeAccountId,
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
