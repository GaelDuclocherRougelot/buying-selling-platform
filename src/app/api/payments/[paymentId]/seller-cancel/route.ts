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
		const { reason } = await request.json();

		if (!reason || reason.trim().length < 10) {
			return NextResponse.json(
				{
					error: "Veuillez fournir une raison détaillée (minimum 10 caractères)",
				},
				{ status: 400 }
			);
		}

		// Récupérer le paiement avec les détails
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

		// Vérifier que l'utilisateur est bien le vendeur
		if (payment.sellerId !== user.id) {
			return NextResponse.json(
				{
					error: "Vous n'êtes pas autorisé à annuler cette vente",
				},
				{ status: 403 }
			);
		}

		// Vérifier que le paiement peut être annulé
		const cancellableStatuses = [
			"pending_buyer_validation",
			"pending_shipping_validation",
		];

		if (!cancellableStatuses.includes(payment.status)) {
			return NextResponse.json(
				{
					error: "Cette vente ne peut plus être annulée dans son état actuel",
				},
				{ status: 400 }
			);
		}

		try {
			console.log(`🚫 Vendeur annule la vente: ${paymentId}`);
			console.log(`📝 Raison: ${reason}`);

			// 1. Rembourser le paiement
			await stripe.refunds.create({
				payment_intent: payment.stripePaymentIntentId,
				reason: "requested_by_customer",
				metadata: {
					reason: "seller_cancelled",
					sellerReason: reason,
					paymentId: paymentId,
					cancelledBy: user.id,
				},
			});

			// 2. Mettre à jour le statut du paiement
			await prisma.payment.update({
				where: { id: paymentId },
				data: {
					status: "seller_cancelled",
					updatedAt: new Date(),
				},
			});

			// 3. Remettre le produit en vente
			await prisma.product.update({
				where: { id: payment.productId },
				data: { status: "available" },
			});

			// 4. Enregistrer la raison de l'annulation (optionnel : créer une table dédiée)
			// Pour l'instant on utilise les logs

			console.log(
				`💸 Vente annulée par le vendeur: ${payment.productId}`
			);

			return NextResponse.json({
				success: true,
				message: "Vente annulée - L'acheteur sera remboursé",
			});
		} catch (stripeError) {
			console.error(
				"❌ Erreur lors de l'annulation Stripe:",
				stripeError
			);
			return NextResponse.json(
				{ error: "Erreur lors de l'annulation du paiement" },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Erreur lors de l'annulation vendeur:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
