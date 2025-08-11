"use client";

import WebSocketStatus from "@/components/messages/WebSocketStatus";
import { useSession } from "@/lib/auth-client";
import { useWebSocket, WebSocketMessage } from "@/lib/hooks/useWebSocket";
import { Conversation, Message } from "@/types/conversation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ChatWindow from "./ChatWindow";
import ConversationsList from "./ConversationsList";

export default function MessagesPage() {
	const { data: session } = useSession();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [selectedConversation, setSelectedConversation] =
		useState<Conversation | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadingMessages, setLoadingMessages] = useState(false);

	// WebSocket hook
	const {
		joinConversation,
		leaveConversation,
		sendMessage,
		markMessagesAsRead,
		isConnected,
		isConnecting,
	} = useWebSocket({
		onNewMessage: (message) => {
			console.log("🎯 MessagesPage: onNewMessage appelé avec:", message);
			handleNewWebSocketMessage(message);
		},
		onMessageSent: (data) => {
			console.log("📤 MessagesPage: onMessageSent appelé avec:", data);
			if (data.success) {
				console.log("✅ Message envoyé avec succès:", data.messageId);

				// Marquer les messages comme lus immédiatement
				markMessagesAsRead(data.message.conversationId);

				// Remplacer le message temporaire par le vrai message
				if (selectedConversation) {
					setSelectedConversation((prev) => {
						if (!prev) return null;

						// Remplacer le message temporaire par le vrai message
						const updatedMessages = prev.messages.map((msg) => {
							if (msg.id.startsWith("temp-")) {
								return {
									...msg,
									id: data.messageId,
									createdAt: new Date().toISOString(),
								};
							}
							return msg;
						});

						return {
							...prev,
							messages: updatedMessages,
						};
					});
				}
			}
		},
		onConnect: () => {
			console.log("🔌 MessagesPage: WebSocket connecté");
		},
		onDisconnect: () => {
			console.log("🔌 MessagesPage: WebSocket déconnecté");
		},
		onError: (error) => {
			console.error("❌ MessagesPage: Erreur WebSocket:", error);
		},
	});

	// Log de debug pour l'état WebSocket
	useEffect(() => {
		console.log(
			"📊 MessagesPage: État WebSocket - isConnected:",
			isConnected,
			"isConnecting:",
			isConnecting
		);
	}, [isConnected, isConnecting]);

	const fetchConversations = async () => {
		try {
			const response = await fetch("/api/messages/conversations");

			if (response.ok) {
				const data = await response.json();
				setConversations(data.conversations || []);
			} else {
				console.error(
					"❌ Erreur API:",
					response.status,
					response.statusText
				);
			}
		} catch (error) {
			console.error(
				"💥 Erreur lors du chargement des conversations:",
				error
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (session?.user?.id) {
			fetchConversations();
		}
	}, [session?.user?.id]); // Seulement l'ID de l'utilisateur, pas tout l'objet session

	const fetchConversationMessages = async (conversationId: string) => {
		try {
			const response = await fetch(
				`/api/messages/conversations/${conversationId}`
			);
			if (response.ok) {
				const data = await response.json();
				console.log("🔄 MessagesPage: Réponse API:", data);
				return data.conversation;
			}
		} catch (error) {
			console.error("Erreur lors du chargement des messages:", error);
		}
		return null;
	};

	const handleConversationSelect = async (conversation: Conversation) => {
		// Quitter la conversation précédente
		if (selectedConversation) {
			leaveConversation(selectedConversation.id);
		}

		// Rejoindre la nouvelle conversation immédiatement
		if (isConnected) {
			joinConversation(conversation.id);
		} else {
			toast.error(
				"❌ Erreur serveur, impossible de rejoindre la conversation"
			);
		}

		// Fetcher les messages complets de cette conversation
		setLoadingMessages(true);
		try {
			const fullConversation = await fetchConversationMessages(
				conversation.id
			);
			if (fullConversation) {
				// Chargement des messages complets de la conversation
				setSelectedConversation(fullConversation);
			} else {
				// Fallback si le fetch échoue
				toast.error(
					"❌ Erreur serveur, impossible de charger les messages"
				);
				setSelectedConversation(conversation);
			}
		} finally {
			setLoadingMessages(false);
		}
	};

	const handleSendMessage = async (
		conversationId: string,
		content: string,
		messageType: "text" | "image" | "file" | "mixed" = "text"
	) => {
		if (!content.trim() || !session?.user?.id) return;
		sendMessage(conversationId, content.trim(), messageType);
	};

	const handleNewWebSocketMessage = (message: WebSocketMessage) => {
		// Mettre à jour la conversation si elle est actuellement sélectionnée
		const newMessage: Message = {
			id: message.data.id,
			conversationId: message.conversationId,
			senderId: message.senderId,
			content: message.data.content,
			messageType: message.data.messageType as "text" | "image" | "file",
			isRead: false,
			createdAt: message.data.createdAt,
			sender: {
				id: message.data.sender.id,
				name: message.data.sender.name,
				image: message.data.sender.image || undefined,
				username: message.data.sender.username || undefined,
			},
		};

		// Mise à jour immédiate de l'état
		setSelectedConversation((prev) => {
			if (!prev) return null;
			return {
				...prev,
				messages: [...prev.messages, newMessage],
			};
		});
		if (selectedConversation?.id === message.conversationId) {
			console.log("✅ Mise à jour immédiate de la conversation active");

			// Ajouter le nouveau message à la conversation
			// Mettre à jour la liste des conversations localement au lieu de refetch
			setConversations((prevConversations) => {
				return prevConversations.map((conv) => {
					if (conv.id === message.conversationId) {
						console.log(
							"🔄 Mise à jour de la liste des conversations"
						);

						const updatedLastMessage: Message = {
							id: message.data.id,
							conversationId: message.conversationId,
							senderId: message.senderId,
							content: message.data.content,
							messageType: message.data.messageType as
								| "text"
								| "image"
								| "file",
							isRead: false,
							createdAt: message.data.createdAt,
							sender: {
								id: message.data.sender.id,
								name: message.data.sender.name,
								image: message.data.sender.image || undefined,
								username:
									message.data.sender.username || undefined,
							},
						};

						return {
							...conv,
							lastMessage: updatedLastMessage,
							updatedAt: new Date().toISOString(),
						};
					}
					return conv;
				});
			});
		}
	};

	if (loading) {
		return (
			<div className="w-full max-w-7xl mx-auto p-6">
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-7xl mx-auto p-6">
			<div className="mb-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Messages
						</h1>
						<p className="text-gray-600 mt-2">
							Gérez vos conversations avec les acheteurs et
							vendeurs
						</p>
					</div>
					<WebSocketStatus />
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
				{/* Liste des conversations */}
				<div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
					<ConversationsList
						conversations={conversations}
						selectedConversation={selectedConversation}
						onConversationSelect={handleConversationSelect}
						currentUserId={session?.user?.id}
					/>
				</div>

				{/* Zone de chat */}
				<div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
					{selectedConversation ? (
						<ChatWindow
							conversation={selectedConversation}
							currentUserId={session?.user?.id}
							onSendMessage={handleSendMessage}
							loading={loadingMessages}
							typingUsers={new Set()}
							onTypingStatusChange={() => {}}
						/>
					) : (
						<div className="flex items-center justify-center h-full text-gray-500">
							<div className="text-center">
								<div className="text-6xl mb-4">💬</div>
								<p className="text-lg">
									Sélectionnez une conversation pour commencer
									à discuter
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
