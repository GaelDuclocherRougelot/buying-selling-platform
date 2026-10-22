import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

		// Le suivi est purement informatif : la libération des fonds passe uniquement
		// par la vérification admin de la preuve ou la validation de l'acheteur.

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
