import { auth } from "@/lib/auth";
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
			},
		});

		if (!product) {
			return NextResponse.json(
				{ error: "Product not found" },
				{ status: 404 }
			);
		}

		if (!product.owner.stripeAccountId) {
			return NextResponse.json(
				{ error: "Seller has not set up payments" },
				{ status: 400 }
			);
		}

		// Calculate platform fee (e.g., 5%)
		const platformFeePercentage = 0.05;
		const platformFeeAmount = Math.round(
			amount * platformFeePercentage * 100
		); // Convert to cents

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
				application_fee_amount: platformFeeAmount,
				transfer_data: {
					destination: product.owner.stripeAccountId,
				},
			},
		});

		// Create payment record in database only if payment_intent exists
		if (checkoutSession.payment_intent) {
			await prisma.payment.create({
				data: {
					stripePaymentIntentId:
						checkoutSession.payment_intent as string,
					amount: amount,
					currency: "eur",
					status: "pending",
					productId: productId,
					buyerId: session.user.id,
					sellerId: product.ownerId,
					applicationFeeAmount: platformFeeAmount / 100, // Convert back to euros
				},
			});
		}

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
