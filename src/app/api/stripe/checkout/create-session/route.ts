import { auth } from "@/lib/auth";
import {
	calculatePlatformFee,
	getPlatformFeeInCents,
	getSellerSalesCount,
} from "@/lib/platform-fees";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

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
		const { productId, amount, productTitle } = body;

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
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile?payment=cancelled`,
			metadata: {
				productId,
				buyerId: session.user.id,
				sellerId: product.ownerId,
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
