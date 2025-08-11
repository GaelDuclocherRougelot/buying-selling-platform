import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const user = await getUser();

		if (!user?.id) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		const { conversationId } = await params;

		// Vérifier que la conversation existe et que l'utilisateur y participe
		const conversation = await prisma.conversation.findFirst({
			where: {
				id: conversationId,
				OR: [{ buyerId: user.id }, { sellerId: user.id }],
			},
			include: {
				product: {
					select: {
						id: true,
						title: true,
						imagesUrl: true,
						price: true,
					},
				},
				buyer: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
				seller: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
			},
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation non trouvée ou accès non autorisé" },
				{ status: 404 }
			);
		}

		// Récupérer tous les messages de la conversation
		const messages = await prisma.message.findMany({
			where: {
				conversationId,
			},
			include: {
				sender: {
					select: {
						id: true,
						name: true,
						image: true,
						username: true,
					},
				},
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		// Marquer les messages comme lus si l'utilisateur n'est pas l'expéditeur
		const messagesToMarkAsRead = messages.filter(
			(message) => !message.isRead && message.senderId !== user.id
		);

		if (messagesToMarkAsRead.length > 0) {
			await prisma.message.updateMany({
				where: {
					id: {
						in: messagesToMarkAsRead.map((m) => m.id),
					},
				},
				data: {
					isRead: true,
				},
			});
		}

		// Enrichir les messages avec les données d'offres si nécessaire
		const enrichedMessages = await Promise.all(
			messages.map(async (message) => {
				if (message.messageType === "offer") {
					const offer = await prisma.offer.findUnique({
						where: {
							messageId: message.id,
						},
					});
					return {
						...message,
						offer,
					};
				}
				return message;
			})
		);

		console.log(enrichedMessages);

		return NextResponse.json({
			conversation: {
				...conversation,
				messages: enrichedMessages,
				lastMessage: messages[messages.length - 1] || null,
				unreadCount: 0,
			},
		});
	} catch (error) {
		console.error("Erreur lors de la récupération des messages:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
