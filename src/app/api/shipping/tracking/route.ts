import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { SmartTrackingSimulation } from "@/services/smart-tracking-simulation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Non authentifié" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { paymentId, trackingNumber } = body;

		if (!paymentId || !trackingNumber) {
			return NextResponse.json(
				{ error: "paymentId et trackingNumber sont requis" },
				{ status: 400 }
			);
		}

		// Vérifier que le paiement existe et appartient à l'utilisateur
		const payment = await prisma.payment.findUnique({
			where: { id: paymentId },
			include: {
				product: true,
				seller: true,
				buyer: true,
			},
		});

		if (!payment) {
			return NextResponse.json(
				{ error: "Paiement non trouvé" },
				{ status: 404 }
			);
		}

		// Vérifier que l'utilisateur est l'acheteur ou le vendeur
		if (
			payment.buyerId !== session.user.id &&
			payment.sellerId !== session.user.id
		) {
			return NextResponse.json(
				{ error: "Accès non autorisé" },
				{ status: 403 }
			);
		}

		// Récupérer le suivi via simulation intelligente (gratuit)
		const trackingData =
			await SmartTrackingSimulation.simulateTracking(trackingNumber);

		// Convertir pour compatibilité avec l'ancien système
		const trackingStatus = {
			code:
				trackingData.events[trackingData.events.length - 1]?.status ||
				"UNKNOWN",
			libelle:
				trackingData.events[trackingData.events.length - 1]
					?.description || "Statut inconnu",
			etape: null,
			description: trackingData.status,
			isDelivered: trackingData.isDelivered,
			isInTransit: trackingData.isInTransit,
			isFailed: false,
		};

		// Créer ou mettre à jour le suivi en base
		const shipmentTracking = await prisma.shipmentTracking.upsert({
			where: { paymentId },
			update: {
				trackingNumber,
				status: trackingStatus.isDelivered
					? "delivered"
					: trackingStatus.isInTransit
						? "in_transit"
						: trackingStatus.isFailed
							? "failed"
							: "pending",
				lastEventCode: trackingStatus.code,
				lastEventLabel: trackingStatus.libelle,
				lastEventDate: new Date(),
				timeline: JSON.stringify(trackingData.events),
				events: JSON.stringify(trackingData.events),
				updatedAt: new Date(),
			},
			create: {
				paymentId,
				trackingNumber,
				status: trackingStatus.isDelivered
					? "delivered"
					: trackingStatus.isInTransit
						? "in_transit"
						: trackingStatus.isFailed
							? "failed"
							: "pending",
				lastEventCode: trackingStatus.code,
				lastEventLabel: trackingStatus.libelle,
				lastEventDate: new Date(),
				timeline: JSON.stringify(trackingData.events),
				events: JSON.stringify(trackingData.events),
			},
		});

		// Si le colis est livré et que le paiement est en attente de validation d'expédition, déclencher le transfert
		if (
			trackingStatus.isDelivered &&
			payment.status === "pending_shipping_validation"
		) {
			try {
				// Transférer l'argent au vendeur (moins les frais de plateforme)
				const transferAmount = Math.round(
					(payment.amount - (payment.applicationFeeAmount || 0)) * 100
				);

				await stripe.transfers.create({
					amount: transferAmount,
					currency: "eur",
					destination: payment.seller.stripeAccountId!,
					metadata: {
						paymentId: payment.id,
						productId: payment.productId,
						buyerId: payment.buyerId,
						sellerId: payment.sellerId,
					},
				});

				// Mettre à jour le statut du paiement
				await prisma.payment.update({
					where: { id: paymentId },
					data: {
						status: "succeeded",
						updatedAt: new Date(),
					},
				});

				// Marquer le produit comme vendu
				await prisma.product.update({
					where: { id: payment.productId },
					data: { status: "sold" },
				});

				console.log(`✅ Paiement transféré au vendeur: ${paymentId}`);
				console.log(`💰 Montant transféré: ${transferAmount / 100}€`);
			} catch (transferError) {
				console.error("❌ Erreur lors du transfert:", transferError);
				return NextResponse.json(
					{ error: "Erreur lors du transfert au vendeur" },
					{ status: 500 }
				);
			}
		}

		return NextResponse.json({
			tracking: shipmentTracking,
			status: trackingStatus,
			isDelivered: trackingStatus.isDelivered,
			currentStep: trackingStatus.etape,
			stepLabel: null,
		});
	} catch (error) {
		console.error("❌ Erreur tracking:", error);
		return NextResponse.json(
			{ error: "Erreur lors du suivi" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Non authentifié" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const paymentId = searchParams.get("paymentId");

		if (!paymentId) {
			return NextResponse.json(
				{ error: "paymentId requis" },
				{ status: 400 }
			);
		}

		// Récupérer le suivi en base
		const shipmentTracking = await prisma.shipmentTracking.findUnique({
			where: { paymentId },
			include: {
				payment: {
					include: {
						product: true,
						seller: true,
						buyer: true,
					},
				},
			},
		});

		if (!shipmentTracking) {
			return NextResponse.json(
				{ error: "Suivi non trouvé" },
				{ status: 404 }
			);
		}

		// Vérifier que l'utilisateur est l'acheteur ou le vendeur
		if (
			shipmentTracking.payment.buyerId !== session.user.id &&
			shipmentTracking.payment.sellerId !== session.user.id
		) {
			return NextResponse.json(
				{ error: "Accès non autorisé" },
				{ status: 403 }
			);
		}

		return NextResponse.json({
			tracking: shipmentTracking,
			payment: shipmentTracking.payment,
		});
	} catch (error) {
		console.error("❌ Erreur récupération tracking:", error);
		return NextResponse.json(
			{ error: "Erreur lors de la récupération du suivi" },
			{ status: 500 }
		);
	}
}
