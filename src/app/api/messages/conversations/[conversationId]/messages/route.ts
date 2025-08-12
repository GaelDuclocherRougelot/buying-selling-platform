import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

		// Récupérer les messages de la conversation
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
				offer: true, // Inclure la relation offer pour les messages de type "offer"
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		return NextResponse.json({
			messages,
		});
	} catch (error) {
		console.error("Erreur lors de la récupération des messages:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
