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

		// Vérifier que l'utilisateur est bien l'acheteur
		if (payment.buyerId !== user.id) {
			return NextResponse.json(
				{
					error: "Vous n'êtes pas autorisé à valider cette vente",
				},
				{ status: 403 }
			);
		}

		// Vérifier que le paiement peut être validé
		const validatableStatuses = ["pending_buyer_validation"];

		if (!validatableStatuses.includes(payment.status)) {
			return NextResponse.json(
				{
					error: "Cette vente ne peut pas être validée dans son état actuel",
				},
				{ status: 400 }
			);
		}

		// Vérifier que c'est bien un produit avec livraison in-person
		if (payment.product.delivery !== "in-person") {
			return NextResponse.json(
				{
					error: "Cette validation n'est disponible que pour les produits avec livraison en main propre",
				},
				{ status: 400 }
			);
		}

		try {
			console.log(`✅ Acheteur valide la vente: ${paymentId}`);

			// 1. Capturer le paiement Stripe
			await stripe.paymentIntents.capture(payment.stripePaymentIntentId);

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
				`✅ Vente validée par l'acheteur: ${payment.productId}`
			);

			return NextResponse.json({
				success: true,
				message: "Vente validée - Paiement transféré au vendeur",
			});
		} catch (stripeError) {
			console.error(
				"❌ Erreur lors de la validation Stripe:",
				stripeError
			);
			return NextResponse.json(
				{ error: "Erreur lors du transfert du paiement" },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Erreur lors de la validation acheteur:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
