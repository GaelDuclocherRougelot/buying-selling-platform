import { auth } from "@/lib/auth";
import {
	calculatePlatformFee,
	getPlatformFeeInCents,
	getSellerSalesCount,
} from "@/lib/platform-fees";
import { prepareCheckout } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// `amount` éventuellement envoyé par le client est ignoré (retiré par Zod)
const createPaymentIntentSchema = z.object({
	productId: z.string(),
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
		const { productId } = createPaymentIntentSchema.parse(body);

		// Mêmes contrôles que create-session ; `amount` du client ignoré
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

		console.log(
			`💰 PaymentIntent - Commission pour vendeur ${product.ownerId}:`
		);
		console.log(`   📊 Ventes réalisées: ${sellerSalesCount}`);
		console.log(`   💳 ${feeInfo.breakdown} = ${feeInfo.feeAmount}€`);

		// Create payment intent with application fee
		const paymentIntent = await stripe.paymentIntents.create({
			amount: Math.round(amount * 100), // Convert to cents
			currency: "eur",
			application_fee_amount: platformFeeAmount,
			transfer_data: {
				destination: stripeAccountId,
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
