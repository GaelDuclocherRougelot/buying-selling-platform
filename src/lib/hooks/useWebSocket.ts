import { useSession } from "@/lib/auth-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface WebSocketMessage {
	type: "new_message" | "message_read" | "typing" | "user_online";
	data: {
		id: string;
		conversationId: string;
		senderId: string;
		content: string;
		messageType: string;
		isRead: boolean;
		createdAt: string;
		sender: {
			id: string;
			name: string;
			image: string | null;
			username: string | null;
		};
	};
	conversationId: string;
	senderId: string;
}

export interface UseWebSocketOptions {
	onNewMessage?: (message: WebSocketMessage) => void;
	onUserTyping?: (data: {
		userId: string;
		conversationId: string;
		isTyping: boolean;
	}) => void;
	onUserOnline?: (data: { userId: string; isOnline: boolean }) => void;
	onConnect?: () => void;
	onDisconnect?: () => void;
	onMessageSent?: (data: {
		success: boolean;
		messageId: string;
		message: WebSocketMessage;
	}) => void;
	onMessageRead?: (data: {
		conversationId: string;
		messageIds: string[];
		readBy: string;
	}) => void;
	onError?: (error: { message: string }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
	console.log("useWebSocket: Hook appelé");
	const { data: session } = useSession();
	console.log("useWebSocket: Session:", session);
	const socketRef = useRef<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);

	const connect = useCallback(() => {
		if (!session?.user?.id || socketRef.current?.connected) {
			return;
		}

		setIsConnecting(true);

		// Créer la connexion WebSocket
		const socket = io(
			process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3001",
			{
				transports: ["websocket"],
				autoConnect: true,
				forceNew: true,
			}
		);

		socketRef.current = socket;

		// Gérer les événements de connexion
		socket.on("connect", () => {
			console.log("WebSocket connecté");
			setIsConnected(true);
			setIsConnecting(false);
			options.onConnect?.();

			// Authentifier l'utilisateur
			socket.emit("authenticate", { userId: session.user.id });
		});

		socket.on("disconnect", () => {
			console.log("WebSocket déconnecté");
			setIsConnected(false);
			options.onDisconnect?.();
		});

		socket.on("authenticated", (data) => {
			console.log("Authentifié sur WebSocket:", data);
		});

		// Gérer les messages entrants
		socket.on("new_message", (message: WebSocketMessage) => {
			console.log(
				"🎯 useWebSocket: Événement new_message reçu:",
				message
			);
			console.log(
				"🎯 useWebSocket: onNewMessage callback existe:",
				!!options.onNewMessage
			);
			options.onNewMessage?.(message);
		});

		socket.on("message_sent", (data) => {
			console.log("📤 useWebSocket: Événement message_sent reçu:", data);
			console.log(
				"📤 useWebSocket: onMessageSent callback existe:",
				!!options.onMessageSent
			);
			options.onMessageSent?.(data);
		});

		socket.on("user_typing", (data) => {
			options.onUserTyping?.(data);
		});

		socket.on("user_online", (data) => {
			options.onUserOnline?.(data);
		});

		// Gérer les erreurs
		socket.on("error", (error) => {
			console.error("Erreur WebSocket:", error);
			options.onError?.(error);
			setIsConnecting(false);
		});

		socket.on("connect_error", (error) => {
			console.error("Erreur de connexion WebSocket:", error);
			setIsConnecting(false);
		});
	}, [session?.user?.id, options]);

	const disconnect = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.disconnect();
			socketRef.current = null;
			setIsConnected(false);
		}
	}, []);

	const joinConversation = useCallback((conversationId: string) => {
		if (socketRef.current?.connected) {
			socketRef.current.emit("join_conversation", { conversationId });
		}
	}, []);

	const leaveConversation = useCallback((conversationId: string) => {
		if (socketRef.current?.connected) {
			socketRef.current.emit("leave_conversation", { conversationId });
		}
	}, []);

	const sendTypingStatus = useCallback(
		(conversationId: string, isTyping: boolean) => {
			if (socketRef.current?.connected) {
				socketRef.current.emit("typing", { conversationId, isTyping });
			}
		},
		[]
	);

	const sendMessage = useCallback(
		(
			conversationId: string,
			content: string,
			messageType: string = "text"
		) => {
			if (socketRef.current?.connected) {
				socketRef.current.emit("send_message", {
					conversationId,
					content,
					messageType,
				});
			}
		},
		[]
	);

	const markMessagesAsRead = useCallback((conversationId: string) => {
		if (socketRef.current?.connected) {
			socketRef.current.emit("mark_messages_read", { conversationId });
		}
	}, []);

	// Se connecter automatiquement quand la session est disponible
	useEffect(() => {
		if (session?.user?.id && !socketRef.current?.connected) {
			connect();
		}

		return () => {
			if (socketRef.current?.connected) {
				disconnect();
			}
		};
	}, [session?.user?.id, options, connect, disconnect]);

	// Nettoyer la connexion à la déconnexion
	useEffect(() => {
		return () => {
			if (socketRef.current?.connected) {
				disconnect();
			}
		};
	}, [options, disconnect]);

	return {
		isConnected,
		isConnecting,
		connect,
		disconnect,
		joinConversation,
		leaveConversation,
		sendTypingStatus,
		sendMessage,
		markMessagesAsRead,
		socket: socketRef.current,
	};
}
