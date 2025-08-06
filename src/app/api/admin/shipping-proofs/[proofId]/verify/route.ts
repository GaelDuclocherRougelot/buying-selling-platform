import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ proofId: string }> }
) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		// Vérifier que l'utilisateur est admin
		if (user.role !== "admin") {
			return NextResponse.json(
				{ error: "Accès refusé" },
				{ status: 403 }
			);
		}

		const { proofId } = await params;
		if (!proofId) {
			return NextResponse.json(
				{ error: "ID de preuve manquant" },
				{ status: 400 }
			);
		}
		const { status } = await request.json();

		if (!status || !["verified", "rejected"].includes(status)) {
			return NextResponse.json(
				{ error: "Statut invalide" },
				{ status: 400 }
			);
		}

		// Mettre à jour la preuve d'expédition
		const updatedProof = await prisma.shippingProof.update({
			where: {
				id: proofId,
			},
			data: {
				status: status,
				verifiedAt: new Date(),
				verifiedBy: user.id,
			},
			include: {
				payment: {
					include: {
						product: true,
						buyer: true,
						seller: true,
					},
				},
			},
		});

		// Si la preuve est validée, capturer le paiement Stripe et transférer au vendeur
		if (status === "verified") {
			try {
				// Capturer le paiement Stripe (transfert automatique au vendeur)
				const paymentIntent = await stripe.paymentIntents.capture(
					updatedProof.payment.stripePaymentIntentId
				);

				console.log(
					`✅ Paiement capturé et transféré: ${paymentIntent.id}`
				);
				console.log(
					`💰 Montant transféré: ${paymentIntent.amount / 100}€`
				);

				// Mettre à jour le statut du paiement
				await prisma.payment.update({
					where: {
						id: updatedProof.paymentId,
					},
					data: {
						status: "succeeded",
						updatedAt: new Date(),
					},
				});

				// Mettre à jour le statut du produit
				await prisma.product.update({
					where: {
						id: updatedProof.payment.productId,
					},
					data: {
						status: "sold",
					},
				});

				console.log(
					`✅ Produit marqué comme vendu: ${updatedProof.payment.productId}`
				);
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
		}

		// Si la preuve est rejetée, rembourser l'acheteur
		if (status === "rejected") {
			try {
				// Rembourser le paiement Stripe
				const refund = await stripe.refunds.create({
					payment_intent: updatedProof.payment.stripePaymentIntentId,
					reason: "requested_by_customer",
					metadata: {
						reason: "shipping_proof_rejected",
						proofId: proofId,
						verifiedBy: user.id,
					},
				});

				console.log(`💸 Remboursement effectué: ${refund.id}`);
				console.log(`💰 Montant remboursé: ${refund.amount / 100}€`);

				// Mettre à jour le statut du paiement
				await prisma.payment.update({
					where: {
						id: updatedProof.paymentId,
					},
					data: {
						status: "refunded",
						updatedAt: new Date(),
					},
				});

				console.log(`✅ Paiement marqué comme remboursé`);
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

		return NextResponse.json({
			message: `Preuve ${status === "verified" ? "validée" : "rejetée"} avec succès`,
			proof: updatedProof,
		});
	} catch (error) {
		console.error("Erreur lors de la vérification de la preuve:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
