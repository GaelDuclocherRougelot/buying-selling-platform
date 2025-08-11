"use client";

import { useSession } from "@/lib/auth-client";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
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

export interface WebSocketContextType {
	isConnected: boolean;
	isConnecting: boolean;
	socket: Socket | null;
	connect: () => void;
	disconnect: () => void;
	joinConversation: (conversationId: string) => void;
	leaveConversation: (conversationId: string) => void;
	sendTypingStatus: (conversationId: string, isTyping: boolean) => void;
	sendMessage: (
		conversationId: string,
		content: string,
		messageType?: string
	) => boolean;
	markMessagesAsRead: (conversationId: string) => void;
	// Event handlers
	onNewMessage: (handler: (message: WebSocketMessage) => void) => () => void;
	onMessageSent: (handler: (data: unknown) => void) => () => void;
	onUserTyping: (handler: (data: unknown) => void) => () => void;
	onUserOnline: (handler: (data: unknown) => void) => () => void;
	onConnect: (handler: () => void) => () => void;
	onDisconnect: (handler: () => void) => () => void;
	onError: (handler: (error: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
	const sessionData = useSession();
	const session = sessionData.data;
	const socketRef = useRef<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);

	// Garde contre les reconnexions multiples
	const connectionAttemptRef = useRef<boolean>(false);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Event handlers registries
	const newMessageHandlers = useRef<Set<(message: WebSocketMessage) => void>>(
		new Set()
	);
	const messageSentHandlers = useRef<Set<(data: unknown) => void>>(new Set());
	const userTypingHandlers = useRef<Set<(data: unknown) => void>>(new Set());
	const userOnlineHandlers = useRef<Set<(data: unknown) => void>>(new Set());
	const connectHandlers = useRef<Set<() => void>>(new Set());
	const disconnectHandlers = useRef<Set<() => void>>(new Set());
	const errorHandlers = useRef<Set<(error: unknown) => void>>(new Set());

	const connect = useCallback(() => {
		if (!session?.user?.id) {
			console.log("WebSocketProvider: Pas de session utilisateur");
			return;
		}

		// Éviter les connexions multiples
		if (connectionAttemptRef.current || socketRef.current?.connected) {
			console.log(
				"WebSocketProvider: Connexion déjà en cours ou déjà connecté"
			);
			return;
		}

		// Nettoyer les connexions précédentes
		if (socketRef.current) {
			console.log(
				"WebSocketProvider: Nettoyage de la connexion précédente"
			);
			socketRef.current.removeAllListeners();
			socketRef.current.disconnect();
			socketRef.current = null;
		}

		console.log("WebSocketProvider: Tentative de connexion...");
		connectionAttemptRef.current = true;
		setIsConnecting(true);

		// Créer la connexion WebSocket avec des paramètres optimisés
		const socket = io(
			process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001",
			{
				transports: ["websocket"],
				autoConnect: true,
				forceNew: false, // Éviter de forcer une nouvelle connexion
				timeout: 10000,
				reconnection: true,
				reconnectionAttempts: 3, // Réduire le nombre de tentatives
				reconnectionDelay: 2000, // Augmenter le délai
				reconnectionDelayMax: 10000, // Délai maximum
			}
		);

		socketRef.current = socket;

		// Gérer les événements de connexion
		socket.on("connect", () => {
			console.log("✅ WebSocket connecté avec succès");
			setIsConnected(true);
			setIsConnecting(false);
			connectionAttemptRef.current = false;

			// Notifier tous les handlers
			connectHandlers.current.forEach((handler) => handler());

			// Authentifier l'utilisateur
			console.log(
				"🔐 Authentification de l'utilisateur:",
				session.user.id
			);
			socket.emit("authenticate", { userId: session.user.id });
		});

		socket.on("disconnect", (reason) => {
			console.log("❌ WebSocket déconnecté:", reason);
			setIsConnected(false);
			connectionAttemptRef.current = false;

			// Notifier tous les handlers
			disconnectHandlers.current.forEach((handler) => handler());
		});

		socket.on("authenticated", (data) => {
			console.log("✅ Authentifié sur WebSocket:", data);
		});

		// Gérer les messages entrants
		socket.on("new_message", (message: WebSocketMessage) => {
			console.log("📨 Message reçu sur WebSocket:", message);
			newMessageHandlers.current.forEach((handler) => handler(message));
		});

		socket.on("message_sent", (data) => {
			console.log("✅ Message envoyé confirmé:", data);
			messageSentHandlers.current.forEach((handler) => handler(data));
		});

		socket.on("user_typing", (data) => {
			console.log("⌨️ Utilisateur en train d'écrire:", data);
			userTypingHandlers.current.forEach((handler) => handler(data));
		});

		socket.on("user_online", (data) => {
			console.log("🟢 Utilisateur en ligne:", data);
			userOnlineHandlers.current.forEach((handler) => handler(data));
		});

		// Gérer les erreurs
		socket.on("error", (error) => {
			console.error("❌ Erreur WebSocket:", error);
			errorHandlers.current.forEach((handler) => handler(error));
			setIsConnecting(false);
			connectionAttemptRef.current = false;
		});

		socket.on("connect_error", (error) => {
			console.error("❌ Erreur de connexion WebSocket:", error);
			setIsConnecting(false);
			connectionAttemptRef.current = false;
		});

		// Gérer les événements de reconnexion avec des limites
		socket.on("reconnect", (attemptNumber) => {
			console.log(
				"🔄 WebSocket reconnecté après",
				attemptNumber,
				"tentatives"
			);
			setIsConnected(true);
			setIsConnecting(false);
			connectionAttemptRef.current = false;
		});

		socket.on("reconnect_attempt", (attemptNumber) => {
			console.log(
				"🔄 Tentative de reconnexion WebSocket:",
				attemptNumber
			);
			// Limiter le nombre de tentatives
			if (attemptNumber > 3) {
				console.log("❌ Trop de tentatives de reconnexion, arrêt");
				socket.disconnect();
				return;
			}
			setIsConnecting(true);
		});

		socket.on("reconnect_error", (error) => {
			console.error("❌ Erreur de reconnexion WebSocket:", error);
			setIsConnecting(false);
			connectionAttemptRef.current = false;
		});

		socket.on("reconnect_failed", () => {
			console.error("❌ Échec de reconnexion WebSocket");
			setIsConnecting(false);
			connectionAttemptRef.current = false;
		});
	}, [session?.user?.id]);

	const disconnect = useCallback(() => {
		// Nettoyer les timeouts
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (socketRef.current) {
			console.log("🔌 Déconnexion WebSocket");
			socketRef.current.removeAllListeners();
			socketRef.current.disconnect();
			socketRef.current = null;
			setIsConnected(false);
			setIsConnecting(false);
			connectionAttemptRef.current = false;
		}
	}, []);

	const joinConversation = useCallback((conversationId: string) => {
		if (socketRef.current?.connected) {
			console.log("🚀 Rejoindre la conversation:", conversationId);
			socketRef.current.emit("join_conversation", { conversationId });
		} else {
			console.warn(
				"⚠️ Impossible de rejoindre la conversation - WebSocket non connecté"
			);
		}
	}, []);

	const leaveConversation = useCallback((conversationId: string) => {
		if (socketRef.current?.connected) {
			console.log("👋 Quitter la conversation:", conversationId);
			socketRef.current.emit("leave_conversation", { conversationId });
		} else {
			console.warn(
				"⚠️ Impossible de quitter la conversation - WebSocket non connecté"
			);
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
				console.log("📤 Envoi de message via WebSocket:", {
					conversationId,
					content,
					messageType,
				});
				socketRef.current.emit("send_message", {
					conversationId,
					content,
					messageType,
				});
				return true;
			} else {
				console.error(
					"❌ Impossible d'envoyer le message - WebSocket non connecté"
				);
				return false;
			}
		},
		[]
	);

	const markMessagesAsRead = useCallback((conversationId: string) => {
		if (socketRef.current?.connected) {
			console.log("👁️ Marquage des messages comme lus:", conversationId);
			socketRef.current.emit("mark_messages_read", { conversationId });
		} else {
			console.warn(
				"⚠️ Impossible de marquer les messages comme lus - WebSocket non connecté"
			);
		}
	}, []);

	// Event handler registration functions
	const onNewMessage = useCallback(
		(handler: (message: WebSocketMessage) => void) => {
			newMessageHandlers.current.add(handler);
			return () => newMessageHandlers.current.delete(handler);
		},
		[]
	);

	const onMessageSent = useCallback((handler: (data: unknown) => void) => {
		messageSentHandlers.current.add(handler);
		return () => messageSentHandlers.current.delete(handler);
	}, []);

	const onUserTyping = useCallback((handler: (data: unknown) => void) => {
		userTypingHandlers.current.add(handler);
		return () => userTypingHandlers.current.delete(handler);
	}, []);

	const onUserOnline = useCallback((handler: (data: unknown) => void) => {
		userOnlineHandlers.current.add(handler);
		return () => userOnlineHandlers.current.delete(handler);
	}, []);

	const onConnect = useCallback((handler: () => void) => {
		connectHandlers.current.add(handler);
		return () => connectHandlers.current.delete(handler);
	}, []);

	const onDisconnect = useCallback((handler: () => void) => {
		disconnectHandlers.current.add(handler);
		return () => disconnectHandlers.current.delete(handler);
	}, []);

	const onError = useCallback((handler: (error: unknown) => void) => {
		errorHandlers.current.add(handler);
		return () => errorHandlers.current.delete(handler);
	}, []);

	// Se connecter automatiquement quand la session est disponible
	useEffect(() => {
		if (
			session?.user?.id &&
			!socketRef.current?.connected &&
			!isConnecting &&
			!connectionAttemptRef.current
		) {
			console.log("🔄 Session disponible, connexion WebSocket...");
			// Délai pour éviter les connexions multiples lors du changement de session
			reconnectTimeoutRef.current = setTimeout(() => {
				connect();
			}, 500);
		}

		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
	}, [session?.user?.id, connect, isConnecting]);

	// Nettoyer la connexion au démontage du composant
	useEffect(() => {
		return () => {
			disconnect();
		};
	}, [disconnect]);

	const contextValue: WebSocketContextType = {
		isConnected,
		isConnecting,
		socket: socketRef.current,
		connect,
		disconnect,
		joinConversation,
		leaveConversation,
		sendTypingStatus,
		sendMessage,
		markMessagesAsRead,
		onNewMessage,
		onMessageSent,
		onUserTyping,
		onUserOnline,
		onConnect,
		onDisconnect,
		onError,
	};

	return (
		<WebSocketContext.Provider value={contextValue}>
			{children}
		</WebSocketContext.Provider>
	);
}

export function useWebSocketContext() {
	const context = useContext(WebSocketContext);
	if (!context) {
		throw new Error(
			"useWebSocketContext must be used within a WebSocketProvider"
		);
	}
	return context;
}
