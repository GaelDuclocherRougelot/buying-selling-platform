import { getUser } from '@/lib/auth-session';
import { prisma } from "@/lib/prisma";
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

		const {
			conversationId,
			content,
			messageType = "text",
		} = await request.json();

		if (!conversationId || !content) {
			return NextResponse.json(
				{ error: "conversationId et content sont requis" },
				{ status: 400 }
			);
		}

		// Vérifier que la conversation existe et que l'utilisateur y participe
		const conversation = await prisma.conversation.findFirst({
			where: {
				id: conversationId,
				OR: [
					{ buyerId: user.id },
					{ sellerId: user.id },
				],
			},
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation non trouvée ou accès non autorisé" },
				{ status: 404 }
			);
		}

		// Créer le message
		const message = await prisma.message.create({
			data: {
				conversationId,
				senderId: user.id,
				content,
				messageType,
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
		});

		// Mettre à jour la date de mise à jour de la conversation
		await prisma.conversation.update({
			where: { id: conversationId },
			data: { updatedAt: new Date() },
		});

		return NextResponse.json({
			message,
		});
	} catch (error) {
		console.error("Erreur lors de l'envoi du message:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
