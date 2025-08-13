"use client";

import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface StartConversationButtonProps {
	productId: string;
	sellerId: string;
	sellerName: string;
	className?: string;
}

export default function StartConversationButton({
	productId,
	sellerId,
	sellerName,
	className = "",
}: StartConversationButtonProps) {
	const { data: session } = useSession();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const handleStartConversation = async () => {
		if (!session?.user?.id) {
			// Rediriger vers la page de connexion
			router.push("/auth/login");
			return;
		}

		// Vérifier que l'utilisateur ne parle pas avec lui-même
		if (session.user.id === sellerId) {
			alert(
				"Vous ne pouvez pas démarrer une conversation avec vous-même"
			);
			return;
		}

		setIsLoading(true);

		try {
			const response = await apiFetch("/api/messages/conversations", {
				method: "POST",
				body: JSON.stringify({
					productId,
					sellerId,
				}),
			});

			if (response.ok) {
				const { conversation } = await response.json();
				// Rediriger vers la page de messagerie avec la conversation ouverte
				router.push(`/auth/messages?conversation=${conversation.id}`);
			} else {
				const error = await response.json();
				alert(`Erreur: ${error.error}`);
			}
		} catch (error) {
			console.error(
				"Erreur lors de la création de la conversation:",
				error
			);
			alert("Erreur lors de la création de la conversation");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button
			onClick={handleStartConversation}
			disabled={isLoading}
			className={`flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
		>
			<MessageCircle className="w-5 h-5" />
			<span>{isLoading ? "Création..." : `Contacter ${sellerName}`}</span>
		</button>
	);
}
