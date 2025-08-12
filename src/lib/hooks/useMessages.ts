import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Conversation, Message } from "@/types/conversation";

export function useMessages() {
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);

	// Récupérer les conversations
	const fetchConversations = useCallback(async (): Promise<
		Conversation[]
	> => {
		setLoading(true);
		try {
			const response = await fetch("/api/messages/conversations");
			if (!response.ok) {
				throw new Error(
					"Erreur lors de la récupération des conversations"
				);
			}
			const data = await response.json();
			return data.conversations || [];
		} catch (error) {
			console.error("Erreur fetchConversations:", error);
			toast.error("Erreur lors de la récupération des conversations");
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	// Récupérer les messages d'une conversation
	const fetchConversationMessages = useCallback(
		async (conversationId: string): Promise<Message[]> => {
			try {
				const response = await fetch(
					`/api/messages/conversations/${conversationId}/messages`
				);
				if (!response.ok) {
					throw new Error(
						"Erreur lors de la récupération des messages"
					);
				}
				const data = await response.json();
				return data.messages || [];
			} catch (error) {
				console.error("Erreur fetchConversationMessages:", error);
				toast.error("Erreur lors de la récupération des messages");
				return [];
			}
		},
		[]
	);

	// Envoyer un message
	const sendMessage = useCallback(
		async (
			conversationId: string,
			content: string,
			messageType: string = "text"
		): Promise<Message | null> => {
			setSending(true);
			try {
				const response = await fetch("/api/messages/send", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						conversationId,
						content,
						messageType,
					}),
				});

				if (!response.ok) {
					throw new Error("Erreur lors de l'envoi du message");
				}

				const data = await response.json();
				toast.success("Message envoyé");
				return data.message;
			} catch (error) {
				console.error("Erreur sendMessage:", error);
				toast.error("Erreur lors de l'envoi du message");
				return null;
			} finally {
				setSending(false);
			}
		},
		[]
	);

	// Marquer les messages comme lus
	const markMessagesAsRead = useCallback(
		async (conversationId: string): Promise<boolean> => {
			try {
				const response = await fetch(
					`/api/messages/conversations/${conversationId}/read`,
					{
						method: "POST",
					}
				);

				if (!response.ok) {
					throw new Error("Erreur lors du marquage des messages");
				}

				return true;
			} catch (error) {
				console.error("Erreur markMessagesAsRead:", error);
				return false;
			}
		},
		[]
	);

	// Créer une nouvelle conversation
	const createConversation = useCallback(
		async (
			productId: string,
			sellerId: string
		): Promise<Conversation | null> => {
			try {
				const response = await fetch("/api/messages/conversations", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						productId,
						sellerId,
					}),
				});

				if (!response.ok) {
					throw new Error(
						"Erreur lors de la création de la conversation"
					);
				}

				const data = await response.json();
				return data.conversation;
			} catch (error) {
				console.error("Erreur createConversation:", error);
				toast.error("Erreur lors de la création de la conversation");
				return null;
			}
		},
		[]
	);

	// Rafraîchir les messages d'une conversation (pour le polling)
	const refreshMessages = useCallback(
		async (
			conversationId: string,
			lastMessageId?: string
		): Promise<Message[]> => {
			try {
				const response = await fetch(
					`/api/messages/conversations/${conversationId}/messages${
						lastMessageId ? `?since=${lastMessageId}` : ""
					}`
				);
				if (!response.ok) {
					throw new Error(
						"Erreur lors du rafraîchissement des messages"
					);
				}
				const data = await response.json();
				return data.messages || [];
			} catch (error) {
				console.error("Erreur refreshMessages:", error);
				return [];
			}
		},
		[]
	);

	return {
		loading,
		sending,
		fetchConversations,
		fetchConversationMessages,
		sendMessage,
		markMessagesAsRead,
		createConversation,
		refreshMessages,
	};
}
