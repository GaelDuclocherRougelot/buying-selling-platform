import { auth } from "@/lib/auth";
import { isCloudinaryUrl } from "@/lib/cloudinary-url";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Types envoyés par le client de chat ("offer" est créé par /api/messages/offers)
const ALLOWED_MESSAGE_TYPES = ["text", "image", "file", "mixed"];

// Les messages image/mixed ne doivent contenir que des URLs Cloudinary en https
function hasValidImageUrls(content: unknown, messageType: string): boolean {
	if (messageType === "image") return isCloudinaryUrl(content);
	if (messageType === "mixed") {
		try {
			const { images } = JSON.parse(content as string);
			return Array.isArray(images) && images.every(isCloudinaryUrl);
		} catch {
			return false;
		}
	}
	return true;
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 400 }
			);
		}

		const user = session.user;

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

		if (
			!ALLOWED_MESSAGE_TYPES.includes(messageType) ||
			!hasValidImageUrls(content, messageType)
		) {
			return NextResponse.json(
				{ error: "Type ou contenu de message invalide" },
				{ status: 400 }
			);
		}

		// Vérifier que la conversation existe et que l'utilisateur y participe
		const conversation = await prisma.conversation.findFirst({
			where: {
				id: conversationId,
				OR: [{ buyerId: user.id }, { sellerId: user.id }],
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

		// Le message est maintenant stocké en base de données
		// L'utilisateur devra rafraîchir ou utiliser un polling pour voir les nouveaux messages

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
