import { prisma } from "@/lib/prisma";
import { securityLog } from "@/lib/security-log";
import { NextRequest, NextResponse } from "next/server";

/**
 * Contrôles communs à create-session et create-payment-intent, et montant
 * calculé côté serveur (le `amount` envoyé par le client est ignoré) :
 * offre acceptée de cet acheteur pour ce produit, sinon product.price,
 * plus les frais de port.
 */
export async function prepareCheckout(
	request: NextRequest,
	productId: unknown,
	buyerId: string
) {
	if (typeof productId !== "string" || !productId) {
		return NextResponse.json({ error: "productId requis" }, { status: 400 });
	}

	const product = await prisma.product.findUnique({
		where: { id: productId },
		include: {
			owner: { select: { stripeAccountId: true } },
			category: { select: { name: true } },
		},
	});
	if (!product) {
		return NextResponse.json({ error: "Product not found" }, { status: 404 });
	}

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

	if (product.ownerId === buyerId) {
		return NextResponse.json(
			{ error: "Vous ne pouvez pas acheter votre propre produit" },
			{ status: 400 }
		);
	}

	const acceptedOffer = await prisma.offer.findFirst({
		where: { status: "accepted", conversation: { productId, buyerId } },
		orderBy: { updatedAt: "desc" },
	});

	// Produit réservé : seul l'acheteur de l'offre acceptée peut payer
	if (product.status === "waiting_payment" && !acceptedOffer) {
		await securityLog("authz.denied", request.headers, {
			path: request.nextUrl.pathname,
			method: request.method,
			userId: buyerId,
			productId,
			reason: "reserved_product",
		});
		return NextResponse.json(
			{ error: "Ce produit est réservé à un autre acheteur" },
			{ status: 403 }
		);
	}

	const existingPayment = await prisma.payment.findFirst({
		where: {
			productId,
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
			{ error: "Ce produit est en cours d'achat par un autre utilisateur" },
			{ status: 400 }
		);
	}

	if (!product.owner.stripeAccountId) {
		return NextResponse.json(
			{ error: "Seller has not set up payments" },
			{ status: 400 }
		);
	}

	const itemPrice = acceptedOffer?.amount ?? product.price;
	const amount = itemPrice + (product.deliveryPrice ?? 0);

	return {
		product,
		stripeAccountId: product.owner.stripeAccountId,
		itemPrice,
		amount,
	};
}
