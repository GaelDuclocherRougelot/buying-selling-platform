import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ paymentId: string }> }
) {
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

		const { paymentId } = await params;
		if (!paymentId) {
			return NextResponse.json(
				{ error: "ID de paiement manquant" },
				{ status: 400 }
			);
		}

		// Récupérer le paiement avec toutes les relations
		const payment = await prisma.payment.findUnique({
			where: { id: paymentId },
			include: {
				product: {
					select: {
						title: true,
						price: true,
					},
				},
				buyer: {
					select: {
						name: true,
						email: true,
					},
				},
				seller: {
					select: {
						name: true,
						email: true,
						stripeAccountId: true,
					},
				},
				shipmentTracking: {
					select: {
						trackingNumber: true,
						status: true,
						lastEventCode: true,
						lastEventLabel: true,
						lastEventDate: true,
						timeline: true,
						events: true,
					},
				},
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

		return NextResponse.json({
			payment: {
				id: payment.id,
				amount: payment.amount,
				currency: payment.currency,
				status: payment.status,
				productId: payment.productId,
				buyerId: payment.buyerId,
				sellerId: payment.sellerId,
				applicationFeeAmount: payment.applicationFeeAmount,
				createdAt: payment.createdAt,
				updatedAt: payment.updatedAt,
				product: payment.product,
				buyer: payment.buyer,
				seller: payment.seller,
				shipmentTracking: payment.shipmentTracking,
			},
		});
	} catch (error) {
		console.error("❌ Erreur récupération paiement:", error);
		return NextResponse.json(
			{ error: "Erreur lors de la récupération du paiement" },
			{ status: 500 }
		);
	}
}
