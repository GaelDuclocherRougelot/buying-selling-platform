import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createPaymentIntentSchema = z.object({
	productId: z.string(),
	amount: z.number().positive(),
});

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
		const { productId, amount } = createPaymentIntentSchema.parse(body);

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

		// Create payment intent with application fee
		const paymentIntent = await stripe.paymentIntents.create({
			amount: Math.round(amount * 100), // Convert to cents
			currency: "eur",
			application_fee_amount: platformFeeAmount,
			transfer_data: {
				destination: product.owner.stripeAccountId,
			},
			metadata: {
				productId,
				buyerId: session.user.id,
				sellerId: product.ownerId,
			},
		});

		// Create payment record in database
		const payment = await prisma.payment.create({
			data: {
				stripePaymentIntentId: paymentIntent.id,
				amount: amount,
				currency: "eur",
				status: "pending",
				productId: productId,
				buyerId: session.user.id,
				sellerId: product.ownerId,
				applicationFeeAmount: platformFeeAmount / 100, // Convert back to euros
			},
		});

		return NextResponse.json({
			clientSecret: paymentIntent.client_secret,
			paymentId: payment.id,
		});
	} catch (error) {
		console.error("Error creating payment intent:", error);
		return NextResponse.json(
			{ error: "Failed to create payment intent" },
			{ status: 500 }
		);
	}
}
