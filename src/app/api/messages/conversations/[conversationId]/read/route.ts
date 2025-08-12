import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		const { conversationId } = await params;
		const userId = session.user.id;

		// Vérifier que la conversation existe et que l'utilisateur y participe
		const conversation = await prisma.conversation.findFirst({
			where: {
				id: conversationId,
				OR: [{ buyerId: userId }, { sellerId: userId }],
			},
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation non trouvée ou accès non autorisé" },
				{ status: 404 }
			);
		}

		// Marquer tous les messages non lus comme lus
		// (seulement ceux qui ne sont pas envoyés par l'utilisateur actuel)
		const updatedMessages = await prisma.message.updateMany({
			where: {
				conversationId,
				senderId: {
					not: userId,
				},
				isRead: false,
			},
			data: {
				isRead: true,
			},
		});

		return NextResponse.json({
			success: true,
			updatedCount: updatedMessages.count,
		});
	} catch (error) {
		console.error("Erreur lors du marquage des messages comme lus:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
