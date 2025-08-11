"use client";

import { Conversation, Message } from "@/types/conversation";
import { useState } from "react";
import ChatWindow from "./ChatWindow";

// Données de démonstration
const demoConversation: Conversation = {
	id: "demo-1",
	productId: "prod-1",
	buyerId: "user-1",
	sellerId: "user-2",
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	product: {
		id: "prod-1",
		title: "iPhone 13 Pro - Excellent état",
		imagesUrl: [
			"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
		],
		price: 799,
	},
	buyer: {
		id: "user-1",
		name: "Marie Dupont",
		image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
		username: "marie_dupont",
	},
	seller: {
		id: "user-2",
		name: "Jean Martin",
		image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
		username: "jean_martin",
	},
	messages: [
		{
			id: "msg-1",
			conversationId: "demo-1",
			senderId: "user-1",
			content:
				"Bonjour ! Je suis intéressé par votre iPhone. Pouvez-vous me donner plus de détails ?",
			messageType: "text",
			isRead: true,
			createdAt: new Date(Date.now() - 3600000).toISOString(),
			sender: {
				id: "user-1",
				name: "Marie Dupont",
				image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
				username: "marie_dupont",
			},
		},
		{
			id: "msg-2",
			conversationId: "demo-1",
			senderId: "user-2",
			content:
				"Bonjour ! Oui, je suis intéressé. Pouvez-vous me montrer plus de photos ?",
			messageType: "text",
			isRead: true,
			createdAt: new Date(Date.now() - 3000000).toISOString(),
			sender: {
				id: "user-2",
				name: "Jean Martin",
				image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
				username: "jean_martin",
			},
		},
		{
			id: "msg-3",
			conversationId: "demo-1",
			senderId: "user-2",
			content:
				"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
			messageType: "image",
			isRead: false,
			createdAt: new Date(Date.now() - 2400000).toISOString(),
			sender: {
				id: "user-2",
				name: "Jean Martin",
				image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
				username: "jean_martin",
			},
		},
		{
			id: "msg-4",
			conversationId: "demo-1",
			senderId: "user-1",
			content: JSON.stringify({
				text: "Parfait ! Je vois que l&apos;état est excellent. Pouvez-vous me confirmer le prix et la disponibilité ?",
				images: [
					"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
					"https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
				],
			}),
			messageType: "mixed",
			isRead: false,
			createdAt: new Date(Date.now() - 1800000).toISOString(),
			sender: {
				id: "user-1",
				name: "Marie Dupont",
				image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
				username: "marie_dupont",
			},
		},
	],
	lastMessage: {
		id: "msg-4",
		conversationId: "demo-1",
		senderId: "user-1",
		content:
			"Parfait ! Je vois que l&apos;état est excellent. Pouvez-vous me confirmer le prix et la disponibilité ?",
		messageType: "mixed",
		isRead: false,
		createdAt: new Date(Date.now() - 1800000).toISOString(),
		sender: {
			id: "user-1",
			name: "Marie Dupont",
			image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
			username: "marie_dupont",
		},
	},
	unreadCount: 1,
};

export default function ImageUploadDemo() {
	const [conversation, setConversation] =
		useState<Conversation>(demoConversation);

	const handleSendMessage = async (
		conversationId: string,
		content: string,
		messageType: "text" | "image" | "file" | "mixed" = "text"
	) => {
		console.log("Envoi de message:", {
			conversationId,
			content,
			messageType,
		});

		// Simuler l&apos;envoi d&apos;un message
		const newMessage: Message = {
			id: `msg-${Date.now()}`,
			conversationId,
			senderId: "user-1",
			content,
			messageType,
			isRead: false,
			createdAt: new Date().toISOString(),
			sender: {
				id: "user-1",
				name: "Marie Dupont",
				image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
				username: "marie_dupont",
			},
		};

		// Ajouter le message à la conversation
		setConversation((prev) => ({
			...prev,
			messages: [...prev.messages, newMessage],
			lastMessage: newMessage,
			unreadCount: prev.unreadCount + 1,
		}));

		// Simuler une réponse automatique
		setTimeout(() => {
			const responseMessage: Message = {
				id: `msg-${Date.now() + 1}`,
				conversationId,
				senderId: "user-2", // Autre utilisateur
				content:
					messageType === "image"
						? "Merci pour l&apos;image ! Elle est très claire."
						: messageType === "mixed"
							? "Excellent ! Je vois le texte et les images. Très pratique !"
							: "Message reçu !",
				messageType: "text",
				isRead: false,
				createdAt: new Date().toISOString(),
				sender: {
					id: "user-2",
					name: "Jean Martin",
					image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
					username: "jean_martin",
				},
			};

			setConversation((prev) => ({
				...prev,
				messages: [...prev.messages, responseMessage],
				lastMessage: responseMessage,
			}));
		}, 2000);
	};

	return (
		<div className="w-full max-w-4xl mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-3xl font-bold text-gray-900">
					Démonstration - Envoi d&apos;images dans les conversations
				</h1>
				<p className="text-gray-600 mt-2">
					Testez la fonctionnalité d&apos;envoi d&apos;images dans les
					messages
				</p>
			</div>

			<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[600px]">
				<ChatWindow
					conversation={conversation}
					currentUserId="user-1"
					onSendMessage={handleSendMessage}
					loading={false}
					typingUsers={new Set()}
					onTypingStatusChange={() => {}}
				/>
			</div>

			<div className="mt-6 p-4 bg-blue-50 rounded-lg">
				<h3 className="font-medium text-blue-900 mb-2">
					Fonctionnalités testées :
				</h3>
				<ul className="text-sm text-blue-800 space-y-1">
					<li>• Sélection d&apos;images multiples (max 5)</li>
					<li>• Prévisualisation des images avant envoi</li>
					<li>• Upload automatique vers Cloudinary</li>
					<li>• Affichage des images dans la conversation</li>
					<li>• Possibilité de cliquer pour agrandir</li>
					<li>• Gestion des erreurs d&apos;upload</li>
				</ul>
			</div>
		</div>
	);
}
