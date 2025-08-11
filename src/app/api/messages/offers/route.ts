import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { CreateOfferRequest } from "@/types/conversation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const user = await getUser();
		if (!user?.id) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		const body: CreateOfferRequest = await request.json();
		const { conversationId, amount, message } = body;

		// Vérifier que la conversation existe et que l'utilisateur y participe
		const conversation = await prisma.conversation.findUnique({
			where: { id: conversationId },
			include: {
				product: true,
				buyer: true,
				seller: true,
			},
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation non trouvée" },
				{ status: 404 }
			);
		}

		// Vérifier que l'utilisateur est soit l'acheteur soit le vendeur
		if (
			conversation.buyerId !== user.id &&
			conversation.sellerId !== user.id
		) {
			return NextResponse.json(
				{ error: "Accès non autorisé à cette conversation" },
				{ status: 403 }
			);
		}

		// Vérifier que le montant est valide
		if (amount <= 0 || amount >= conversation.product.price) {
			return NextResponse.json(
				{
					error: "Le montant de l'offre doit être inférieur au prix original et supérieur à 0",
				},
				{ status: 400 }
			);
		}

		// Créer le message d'offre
		const offerMessage = await prisma.message.create({
			data: {
				conversationId,
				senderId: user.id,
				content: `Offre de ${amount.toFixed(2)}€${message ? ` - ${message}` : ""}`,
				messageType: "offer",
			},
		});

		// Créer l'offre
		const offer = await prisma.offer.create({
			data: {
				conversationId,
				messageId: offerMessage.id,
				senderId: user.id,
				amount,
				originalPrice: conversation.product.price,
				offerMessage: message,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
			},
		});

		// Mettre à jour le message avec l'ID de l'offre
		await prisma.message.update({
			where: { id: offerMessage.id },
			data: {
				content: JSON.stringify({ offerId: offer.id, amount, message }),
			},
		});

		return NextResponse.json({
			success: true,
			offer: {
				id: offer.id,
				amount: offer.amount,
				status: offer.status,
				message: offer.offerMessage,
				expiresAt: offer.expiresAt,
			},
			message: offerMessage,
		});
	} catch (error) {
		console.error("Erreur lors de la création de l'offre:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
