import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ paymentId: string }> }
) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		const { paymentId } = await params;
		const { action, reason } = await request.json(); // "accept" ou "reject"

		if (!action || !["accept", "reject"].includes(action)) {
			return NextResponse.json(
				{ error: "Action invalide" },
				{ status: 400 }
			);
		}

		// Récupérer le paiement avec les détails du produit
		const payment = await prisma.payment.findUnique({
			where: { id: paymentId },
			include: {
				product: true,
				buyer: true,
				seller: true,
			},
		});

		if (!payment) {
			return NextResponse.json(
				{ error: "Paiement non trouvé" },
				{ status: 404 }
			);
		}

		// Vérifier que l'utilisateur est bien l'acheteur
		if (payment.buyerId !== user.id) {
			return NextResponse.json(
				{ error: "Vous n'êtes pas autorisé à valider ce paiement" },
				{ status: 403 }
			);
		}

		// Note: Validation d'acheteur disponible pour tous types de livraison
		// Pas de restriction sur le type de livraison

		// Vérifier que le paiement peut être validé
		const validatableStatuses = [
			"pending_buyer_validation",
			"pending_shipping_validation",
		];

		if (!validatableStatuses.includes(payment.status)) {
			return NextResponse.json(
				{
					error: "Ce paiement ne peut pas être validé dans son état actuel",
				},
				{ status: 400 }
			);
		}

		if (action === "accept") {
			// ✅ ACCEPTER - Capturer le paiement et transférer au vendeur
			try {
				console.log(`✅ Acheteur accepte le produit: ${paymentId}`);

				// 1. Capturer le paiement Stripe
				await stripe.paymentIntents.capture(
					payment.stripePaymentIntentId
				);

				// 2. Mettre à jour le statut du paiement
				await prisma.payment.update({
					where: { id: paymentId },
					data: {
						status: "succeeded",
						updatedAt: new Date(),
					},
				});

				// 3. Marquer le produit comme vendu
				await prisma.product.update({
					where: { id: payment.productId },
					data: { status: "sold" },
				});

				console.log(
					`✅ Produit vendu par validation acheteur: ${payment.productId}`
				);

				return NextResponse.json({
					success: true,
					message: "Produit accepté - Paiement transféré au vendeur",
				});
			} catch (stripeError) {
				console.error(
					"❌ Erreur lors de la capture Stripe:",
					stripeError
				);
				return NextResponse.json(
					{ error: "Erreur lors du transfert du paiement" },
					{ status: 500 }
				);
			}
		} else if (action === "reject") {
			// ❌ REJETER - Rembourser l'acheteur
			try {
				console.log(`❌ Acheteur rejette le produit: ${paymentId}`);
				console.log(`📝 Raison: ${reason || "Non spécifiée"}`);

				// 1. Rembourser le paiement
				await stripe.refunds.create({
					payment_intent: payment.stripePaymentIntentId,
					reason: "requested_by_customer",
					metadata: {
						reason: "buyer_rejected_in_person",
						buyerReason: reason || "Product not as expected",
						paymentId: paymentId,
					},
				});

				// 2. Mettre à jour le statut du paiement
				await prisma.payment.update({
					where: { id: paymentId },
					data: {
						status: "refunded",
						updatedAt: new Date(),
					},
				});

				// 3. Remettre le produit en vente
				await prisma.product.update({
					where: { id: payment.productId },
					data: { status: "available" },
				});

				console.log(
					`💸 Produit remboursé par rejet acheteur: ${payment.productId}`
				);

				return NextResponse.json({
					success: true,
					message: "Produit rejeté - Remboursement effectué",
				});
			} catch (stripeError) {
				console.error(
					"❌ Erreur lors du remboursement Stripe:",
					stripeError
				);
				return NextResponse.json(
					{ error: "Erreur lors du remboursement" },
					{ status: 500 }
				);
			}
		}
	} catch (error) {
		console.error("Erreur lors de la validation acheteur:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
