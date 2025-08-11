import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { RespondToOfferRequest } from "@/types/conversation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ offerId: string }> }
) {
	try {
		const user = await getUser();
		if (!user?.id) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		const { offerId } = await params;
		const body: RespondToOfferRequest = await request.json();
		const { response } = body;

		// Récupérer l'offre avec la conversation et le produit
		const offer = await prisma.offer.findUnique({
			where: { id: offerId },
			include: {
				conversation: {
					include: {
						product: true,
						buyer: true,
						seller: true,
					},
				},
				message: true,
			},
		});

		if (!offer) {
			return NextResponse.json(
				{ error: "Offre non trouvée" },
				{ status: 404 }
			);
		}

		// Vérifier que l'utilisateur peut répondre à cette offre
		// Seul l'autre participant de la conversation peut répondre
		if (
			offer.conversation.buyerId !== user.id &&
			offer.conversation.sellerId !== user.id
		) {
			return NextResponse.json(
				{ error: "Accès non autorisé à cette offre" },
				{ status: 403 }
			);
		}

		// Vérifier que l'offre n'est pas déjà traitée
		if (offer.status !== "pending") {
			return NextResponse.json(
				{ error: "Cette offre a déjà été traitée" },
				{ status: 400 }
			);
		}

		// Mettre à jour le statut de l'offre
		await prisma.offer.update({
			where: { id: offerId },
			data: { status: response },
		});

		return NextResponse.json({
			success: true,
			response,
		});
	} catch (error) {
		console.error("Erreur lors de la réponse à l&apos;offre:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
