import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useErrorHandler } from "./useErrorHandler";

import { Conversation, Message } from "@/types/conversation";
import { apiFetch } from "../api";

export function useMessages() {
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const { handleError, handleApiError } = useErrorHandler();

	// Récupérer les conversations
	const fetchConversations = useCallback(async (): Promise<
		Conversation[]
	> => {
		setLoading(true);
		try {
			const response = await fetch("/api/messages/conversations");
			if (!response.ok) {
				handleApiError(
					response,
					"Erreur lors de la récupération des conversations"
				);
				return [];
			}
			const data = await response.json();
			return data.conversations || [];
		} catch (error) {
			handleError(error, {
				fallbackMessage:
					"Erreur lors de la récupération des conversations",
				showToast: true,
				logToConsole: true,
			});
			return [];
		} finally {
			setLoading(false);
		}
	}, [handleError, handleApiError]);

	// Récupérer les messages d'une conversation
	const fetchConversationMessages = useCallback(
		async (conversationId: string): Promise<Message[]> => {
			try {
				const response = await fetch(
					`/api/messages/conversations/${conversationId}/messages`
				);
				if (!response.ok) {
					handleApiError(
						response,
						"Erreur lors de la récupération des messages"
					);
					return [];
				}
				const data = await response.json();
				return data.messages || [];
			} catch (error) {
				handleError(error, {
					fallbackMessage:
						"Erreur lors de la récupération des messages",
					showToast: true,
					logToConsole: true,
				});
				return [];
			}
		},
		[handleError, handleApiError]
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
				const response = await apiFetch("/api/messages/send", {
					method: "POST",
					body: JSON.stringify({
						conversationId,
						content,
						messageType,
					}),
				});

				if (!response.ok) {
					handleApiError(
						response,
						"Erreur lors de l'envoi du message"
					);
					return null;
				}

				const data = await response.json();
				toast.success("Message envoyé");
				return data.message;
			} catch (error) {
				handleError(error, {
					fallbackMessage: "Erreur lors de l'envoi du message",
					showToast: true,
					logToConsole: true,
				});
				return null;
			} finally {
				setSending(false);
			}
		},
		[handleError, handleApiError]
	);

	// Marquer les messages comme lus
	const markMessagesAsRead = useCallback(
		async (conversationId: string): Promise<boolean> => {
			try {
				const response = await apiFetch(
					`/api/messages/conversations/${conversationId}/read`,
					{
						method: "POST",
					}
				);

				if (!response.ok) {
					handleApiError(
						response,
						"Erreur lors du marquage des messages"
					);
					return false;
				}

				return true;
			} catch (error) {
				handleError(error, {
					fallbackMessage: "Erreur lors du marquage des messages",
					showToast: false,
					logToConsole: true,
				});
				return false;
			}
		},
		[handleError, handleApiError]
	);

	// Récupérer les nouveaux messages depuis un ID donné
	const refreshMessages = useCallback(
		async (
			conversationId: string,
			sinceMessageId?: string
		): Promise<Message[]> => {
			try {
				const url = sinceMessageId
					? `/api/messages/conversations/${conversationId}/messages?since=${sinceMessageId}`
					: `/api/messages/conversations/${conversationId}/messages`;

				const response = await apiFetch(url);
				if (!response.ok) {
					handleApiError(
						response,
						"Erreur lors de la récupération des nouveaux messages"
					);
					return [];
				}
				const data = await response.json();
				return data.messages || [];
			} catch (error) {
				handleError(error, {
					fallbackMessage:
						"Erreur lors de la récupération des nouveaux messages",
					showToast: false,
					logToConsole: true,
				});
				return [];
			}
		},
		[handleError, handleApiError]
	);

	// Créer une nouvelle conversation
	const createConversation = useCallback(
		async (
			productId: string,
			sellerId: string,
			initialMessage: string
		): Promise<Conversation | null> => {
			try {
				const response = await apiFetch("/api/messages/conversations", {
					method: "POST",
					body: JSON.stringify({
						productId,
						sellerId,
						initialMessage,
					}),
				});

				if (!response.ok) {
					handleApiError(
						response,
						"Erreur lors de la création de la conversation"
					);
					return null;
				}

				const data = await response.json();
				toast.success("Conversation créée");
				return data.conversation;
			} catch (error) {
				handleError(error, {
					fallbackMessage:
						"Erreur lors de la création de la conversation",
					showToast: true,
					logToConsole: true,
				});
				return null;
			}
		},
		[handleError, handleApiError]
	);

	return {
		loading,
		sending,
		fetchConversations,
		fetchConversationMessages,
		sendMessage,
		markMessagesAsRead,
		refreshMessages,
		createConversation,
	};
}
