import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

		const userId = session.user.id;

		// Récupérer toutes les conversations où l'utilisateur est acheteur ou vendeur
		const conversations = await prisma.conversation.findMany({
			where: {
				OR: [{ buyerId: userId }, { sellerId: userId }],
			},
			include: {
				product: {
					select: {
						id: true,
						title: true,
						imagesUrl: true,
						price: true,
						status: true,
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
				messages: {
					orderBy: {
						createdAt: "desc",
					},
					take: 1,
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
				},
			},
			orderBy: {
				updatedAt: "desc",
			},
		});

		// Traiter les conversations pour ajouter les informations nécessaires
		const processedConversations = conversations.map((conversation) => {
			const lastMessage = conversation.messages[0];
			const unreadCount = conversation.messages.filter(
				(message) => !message.isRead && message.senderId !== userId
			).length;

			return {
				...conversation,
				lastMessage: lastMessage || null,
				unreadCount,
				messages: [], // On ne renvoie pas tous les messages ici
			};
		});

		return NextResponse.json({
			conversations: processedConversations,
		});
	} catch (error) {
		console.error(
			"Erreur lors de la récupération des conversations:",
			error
		);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
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

		const { productId, sellerId } = await request.json();

		if (!productId || !sellerId) {
			return NextResponse.json(
				{ error: "productId et sellerId sont requis" },
				{ status: 400 }
			);
		}

		const buyerId = session.user.id;

		// Vérifier que l'utilisateur ne crée pas une conversation avec lui-même
		if (buyerId === sellerId) {
			return NextResponse.json(
				{
					error: "Vous ne pouvez pas créer une conversation avec vous-même",
				},
				{ status: 400 }
			);
		}

		// Vérifier que le produit existe et appartient au vendeur
		const product = await prisma.product.findFirst({
			where: {
				id: productId,
				ownerId: sellerId,
			},
		});

		if (!product) {
			return NextResponse.json(
				{ error: "Produit non trouvé ou n'appartient pas au vendeur" },
				{ status: 404 }
			);
		}

		// Vérifier si une conversation existe déjà
		let conversation = await prisma.conversation.findFirst({
			where: {
				productId,
				buyerId,
				sellerId,
			},
		});

		if (!conversation) {
			// Créer une nouvelle conversation
			conversation = await prisma.conversation.create({
				data: {
					productId,
					buyerId,
					sellerId,
				},
				include: {
					product: {
						select: {
							id: true,
							title: true,
							imagesUrl: true,
							price: true,
							status: true,
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
		}

		return NextResponse.json({
			conversation: {
				...conversation,
				lastMessage: null,
				unreadCount: 0,
			},
		});
	} catch (error) {
		console.error("Erreur lors de la création de la conversation:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
