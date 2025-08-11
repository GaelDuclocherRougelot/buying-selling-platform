"use client";

import { useSession } from "@/lib/auth-client";
import { useWebSocketContext } from "@/lib/contexts/WebSocketContext";
import { Bell, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MessageNotifications() {
	const { data: session } = useSession();
	const [unreadCount, setUnreadCount] = useState(0);
	const [, setHasNewMessages] = useState(false);

	// WebSocket pour recevoir les nouveaux messages
	const { isConnected, onNewMessage } = useWebSocketContext();

	// Écouter les nouveaux messages
	useEffect(() => {
		const unsubscribe = onNewMessage((message) => {
			// Vérifier si le message n'est pas de l'utilisateur actuel
			if (message.senderId !== session?.user?.id) {
				setHasNewMessages(true);
				// Incrémenter le compteur de messages non lus
				setUnreadCount((prev) => prev + 1);
			}
		});

		return unsubscribe;
	}, [onNewMessage, session?.user?.id]);

	// Charger le nombre de messages non lus au démarrage
	useEffect(() => {
		if (session?.user?.id) {
			fetchUnreadCount();
		}
	}, [session?.user?.id]);

	const fetchUnreadCount = async () => {
		try {
			const response = await fetch("/api/messages/conversations");
			if (response.ok) {
				const data = await response.json();
				const totalUnread = data.conversations.reduce(
					(sum: number, conv: { unreadCount: number }) => sum + conv.unreadCount,
					0
				);
				setUnreadCount(totalUnread);
			}
		} catch (error) {
			console.error(
				"Erreur lors du chargement des messages non lus:",
				error
			);
		}
	};

	const handleClick = () => {
		setHasNewMessages(false);
		setUnreadCount(0);
	};

	if (!session?.user?.id) {
		return null;
	}

	return (
		<Link
			href="/auth/messages"
			onClick={handleClick}
			className="relative flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 transition-colors"
		>
			<MessageCircle className="w-6 h-6" />

			{/* Indicateur de nouveaux messages */}
			{unreadCount > 0 && (
				<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
					{unreadCount > 99 ? "99+" : unreadCount}
				</span>
			)}

			{/* Indicateur de connexion WebSocket */}
			{!isConnected && (
				<span className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center">
					<Bell className="w-2 h-2" />
				</span>
			)}
		</Link>
	);
}
