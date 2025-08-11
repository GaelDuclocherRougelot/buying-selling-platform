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

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ proofId: string }> }
) {
	try {
		const { proofId } = await params;
		const body = await request.json();
		const { action, adminId, status } = body; // Accepter les deux formats

		// Déterminer l'action à partir des paramètres
		let finalAction = action;
		if (status === "verified") finalAction = "approve";
		if (status === "rejected") finalAction = "reject";

		if (!finalAction || !["approve", "reject"].includes(finalAction)) {
			return NextResponse.json(
				{
					error: "Action invalide. Utilisez 'approve'/'reject' ou 'verified'/'rejected'",
				},
				{ status: 400 }
			);
		}

		// Récupérer la preuve d'expédition
		const shippingProof = await prisma.shippingProof.findUnique({
			where: { id: proofId },
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

		if (!shippingProof) {
			return NextResponse.json(
				{ error: "Preuve d'expédition non trouvée" },
				{ status: 404 }
			);
		}

		const payment = shippingProof.payment;

		if (finalAction === "approve") {
			// ✅ APPROUVER - Capturer le paiement et transférer au vendeur

			try {
				console.log(
					`🔍 Validation de la preuve ${proofId} pour le paiement ${payment.id}`
				);

				// 1. Vérifier le statut Stripe du PaymentIntent
				let paymentIntent;
				try {
					paymentIntent = await stripe.paymentIntents.retrieve(
						payment.stripePaymentIntentId
					);
					console.log(
						`📊 Statut Stripe du PaymentIntent: ${paymentIntent.status}`
					);
				} catch (stripeError) {
					console.error(
						"❌ Erreur lors de la récupération du PaymentIntent:",
						stripeError
					);
					return NextResponse.json(
						{
							error: `Erreur lors de la récupération du PaymentIntent: ${stripeError}`,
						},
						{ status: 500 }
					);
				}

				// 2. Capturer le paiement Stripe seulement s'il n'est pas déjà capturé
				if (paymentIntent.status === "requires_capture") {
					try {
						paymentIntent = await stripe.paymentIntents.capture(
							payment.stripePaymentIntentId
						);
						console.log(
							`✅ Paiement Stripe capturé: ${paymentIntent.id}`
						);
					} catch (captureError) {
						console.error(
							"❌ Erreur lors de la capture:",
							captureError
						);
						return NextResponse.json(
							{
								error: `Erreur lors de la capture du paiement: ${captureError}`,
							},
							{ status: 500 }
						);
					}
				} else if (paymentIntent.status === "succeeded") {
					console.log(
						`ℹ️ Paiement Stripe déjà capturé: ${paymentIntent.id}`
					);
				} else {
					console.log(
						`⚠️ Statut Stripe inattendu: ${paymentIntent.status}`
					);
				}

				// 3. Mettre à jour le statut du paiement en base
				await prisma.payment.update({
					where: { id: payment.id },
					data: {
						status: "succeeded",
						updatedAt: new Date(),
					},
				});

				console.log(`✅ Statut du paiement mis à jour: succeeded`);

				// 4. Marquer le produit comme vendu
				await prisma.product.update({
					where: { id: payment.productId },
					data: { status: "sold" },
				});

				console.log(
					`✅ Produit marqué comme vendu: ${payment.productId}`
				);

				// 5. Mettre à jour la preuve d'expédition
				await prisma.shippingProof.update({
					where: { id: proofId },
					data: {
						status: "verified",
						verifiedAt: new Date(),
						verifiedBy: adminId || "admin",
					},
				});

				console.log(`✅ Preuve d'expédition marquée comme vérifiée`);

				return NextResponse.json({
					success: true,
					message: "Preuve approuvée - Paiement transféré",
				});
			} catch (stripeError) {
				console.error("❌ Erreur lors de la validation:", stripeError);
				return NextResponse.json(
					{
						error: `Erreur lors du transfert du paiement: ${stripeError}`,
					},
					{ status: 500 }
				);
			}
		} else if (finalAction === "reject") {
			// ❌ REJETER - Rembourser l'acheteur
			try {
				console.log(
					`🔍 Rejet de la preuve ${proofId} pour le paiement ${payment.id}`
				);

				// 1. Rembourser le paiement
				const refund = await stripe.refunds.create({
					payment_intent: payment.stripePaymentIntentId,
					reason: "requested_by_customer",
				});

				console.log(`✅ Remboursement effectué: ${refund.id}`);

				// 2. Mettre à jour le statut du paiement
				await prisma.payment.update({
					where: { id: payment.id },
					data: {
						status: "refunded",
						updatedAt: new Date(),
					},
				});

				console.log(`✅ Statut du paiement mis à jour: refunded`);

				// 3. Remettre le produit en vente
				await prisma.product.update({
					where: { id: payment.productId },
					data: { status: "available" },
				});

				console.log(`✅ Produit remis en vente: ${payment.productId}`);

				// 4. Mettre à jour la preuve d'expédition
				await prisma.shippingProof.update({
					where: { id: proofId },
					data: {
						status: "rejected",
						rejectedAt: new Date(),
						rejectedBy: adminId || "admin",
					},
				});

				console.log(`✅ Preuve d'expédition marquée comme rejetée`);

				return NextResponse.json({
					success: true,
					message: "Preuve rejetée - Remboursement effectué",
				});
			} catch (stripeError) {
				console.error("❌ Erreur lors du rejet:", stripeError);
				return NextResponse.json(
					{ error: `Erreur lors du remboursement: ${stripeError}` },
					{ status: 500 }
				);
			}
		} else {
			return NextResponse.json(
				{ error: "Action invalide" },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error("❌ Erreur générale:", error);
		return NextResponse.json(
			{ error: `Erreur interne: ${error}` },
			{ status: 500 }
		);
	}
}
