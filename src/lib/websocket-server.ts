import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "./prisma";

const hostname = "localhost";
const port = parseInt(process.env.WEBSOCKET_PORT || "3001", 10);

// Créer le serveur HTTP pour WebSocket
const server = createServer();

// Initialiser Socket.IO
const io = new SocketIOServer(server, {
	cors: {
		origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
		methods: ["GET", "POST"],
		credentials: true,
	},
	transports: ["websocket"],
	allowEIO3: true,
});

// Gérer les connexions WebSocket
io.on("connection", (socket) => {
	console.log(`🔌 Nouveau socket connecté: ${socket.id}`);
	console.log(
		`👥 Nombre total de sockets connectés: ${io.engine.clientsCount}`
	);

	// Authentifier l'utilisateur
	socket.on("authenticate", async (data: { userId: string }) => {
		try {
			const { userId } = data;
			console.log(
				"🔐 Tentative d'authentification pour l'utilisateur:",
				userId
			);

			// Vérifier que l'utilisateur existe
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (user) {
				socket.data.userId = userId;
				socket.emit("authenticated", { userId, success: true });
				console.log(
					`✅ Utilisateur ${userId} authentifié sur le socket ${socket.id}`
				);
			} else {
				console.log("❌ Utilisateur non trouvé:", userId);
				socket.emit("error", { message: "Utilisateur non trouvé" });
			}
		} catch (error) {
			console.error("Erreur d'authentification WebSocket:", error);
			socket.emit("error", {
				message: "Erreur d'authentification",
			});
		}
	});

	// Rejoindre une conversation
	socket.on("join_conversation", (data: { conversationId: string }) => {
		const { conversationId } = data;
		console.log(
			`🚀 Socket ${socket.id} tente de rejoindre la conversation ${conversationId}`
		);

		socket.join(`conversation_${conversationId}`);
		console.log(
			`✅ Socket ${socket.id} a rejoint la conversation ${conversationId}`
		);

		// Vérifier les rooms du socket
		const rooms = Array.from(socket.rooms);
		console.log(`🏠 Rooms actuelles du socket ${socket.id}:`, rooms);
	});

	// Quitter une conversation
	socket.on("leave_conversation", (data: { conversationId: string }) => {
		const { conversationId } = data;
		console.log(
			`👋 Socket ${socket.id} quitte la conversation ${conversationId}`
		);

		socket.leave(`conversation_${conversationId}`);
		console.log(
			`✅ Socket ${socket.id} a quitté la conversation ${conversationId}`
		);

		// Vérifier les rooms du socket
		const rooms = Array.from(socket.rooms);
		console.log(`🏠 Rooms actuelles du socket ${socket.id}:`, rooms);
	});

	// Gérer l'envoi de messages
	socket.on(
		"send_message",
		async (data: {
			conversationId: string;
			content: string;
			messageType?: string;
		}) => {
			try {
				console.log("📨 Événement send_message reçu:", data);
				const { conversationId, content, messageType = "text" } = data;
				const senderId = socket.data.userId;

				console.log("👤 Sender ID:", senderId);
				console.log("💬 Contenu:", content);

				if (!senderId) {
					console.log("❌ Pas de senderId");
					socket.emit("error", {
						message: "Utilisateur non authentifié",
					});
					return;
				}

				// Vérifier que l'utilisateur participe à la conversation
				const conversation = await prisma.conversation.findFirst({
					where: {
						id: conversationId,
						OR: [{ buyerId: senderId }, { sellerId: senderId }],
					},
				});

				console.log(
					"🔍 Conversation trouvée:",
					conversation ? "OUI" : "NON"
				);

				if (!conversation) {
					console.log(
						"❌ Conversation non trouvée ou accès non autorisé"
					);
					socket.emit("error", {
						message:
							"Conversation non trouvée ou accès non autorisé",
					});
					return;
				}

				// Créer le message en base de données
				const message = await prisma.message.create({
					data: {
						conversationId,
						senderId,
						content,
						messageType,
						isRead: false,
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

				console.log("💾 Message créé en BDD:", message.id);

				// Mettre à jour la conversation (updatedAt)
				await prisma.conversation.update({
					where: { id: conversationId },
					data: { updatedAt: new Date() },
				});

				// Émettre le message à tous les participants de la conversation
				const messageData = {
					type: "new_message",
					data: message,
					conversationId,
					senderId,
				};

				console.log(
					"📤 Émission du message à la room:",
					`conversation_${conversationId}`
				);
				console.log("📋 Données du message:", messageData);

				// Vérifier combien de clients sont dans la room
				const room = io.sockets.adapter.rooms.get(
					`conversation_${conversationId}`
				);
				const clientCount = room ? room.size : 0;
				console.log(
					`👥 Nombre de clients dans la room conversation_${conversationId}: ${clientCount}`
				);

				io.to(`conversation_${conversationId}`).emit(
					"new_message",
					messageData
				);

				console.log("✅ Message émis avec succès");

				// Confirmer l'envoi à l'expéditeur
				socket.emit("message_sent", {
					success: true,
					messageId: message.id,
					message: messageData,
				});

				console.log(`Message envoyé et sauvegardé: ${message.id}`);
			} catch (error) {
				console.error("Erreur lors de l'envoi du message:", error);
				socket.emit("error", {
					message: "Erreur lors de l'envoi du message",
				});
			}
		}
	);

	// Gérer la frappe
	socket.on(
		"typing",
		(data: { conversationId: string; isTyping: boolean }) => {
			const { conversationId, isTyping } = data;
			socket.to(`conversation_${conversationId}`).emit("user_typing", {
				userId: socket.data.userId,
				conversationId,
				isTyping,
			});
		}
	);

	// Marquer les messages comme lus
	socket.on(
		"mark_messages_read",
		async (data: { conversationId: string }) => {
			try {
				const { conversationId } = data;
				const userId = socket.data.userId;

				if (!userId) return;

				// Marquer tous les messages non lus de cette conversation comme lus
				await prisma.message.updateMany({
					where: {
						conversationId,
						senderId: { not: userId },
						isRead: false,
					},
					data: { isRead: true },
				});

				// Notifier les autres participants
				socket
					.to(`conversation_${conversationId}`)
					.emit("messages_read", {
						conversationId,
						readBy: userId,
					});
			} catch (error) {
				console.error(
					"Erreur lors du marquage des messages comme lus:",
					error
				);
			}
		}
	);

	// Gérer la déconnexion
	socket.on("disconnect", () => {
		console.log(`🔌 Socket déconnecté: ${socket.id}`);
		console.log(
			`👥 Nombre total de sockets connectés: ${io.engine.clientsCount}`
		);
	});
});

// Démarrer le serveur WebSocket
server.listen(port, () => {
	console.log(`> Serveur WebSocket démarré sur ws://${hostname}:${port}`);
	console.log(
		`> CORS configuré pour: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`
	);
});

// Gestion des erreurs
server.on("error", (error) => {
	console.error("Erreur du serveur WebSocket:", error);
});

process.on("SIGINT", () => {
	console.log("Arrêt du serveur WebSocket...");
	server.close(() => {
		console.log("Serveur WebSocket arrêté");
		process.exit(0);
	});
});
