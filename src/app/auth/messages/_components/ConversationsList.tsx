"use client";

import { Conversation } from "@/types/conversation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageCircle, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ConversationsListProps {
	conversations: Conversation[];
	selectedConversation: Conversation | null;
	onConversationSelect: (conversation: Conversation) => void;
	currentUserId?: string;
}

export default function ConversationsList({
	conversations,
	selectedConversation,
	onConversationSelect,
	currentUserId,
}: ConversationsListProps) {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredConversations = conversations.filter((conversation) => {
		const searchLower = searchTerm.toLowerCase();
		const productTitle = conversation.product?.title?.toLowerCase() || "";
		const buyerName = conversation.buyer?.name?.toLowerCase() || "";
		const sellerName = conversation.seller?.name?.toLowerCase() || "";

		return (
			productTitle.includes(searchLower) ||
			buyerName.includes(searchLower) ||
			sellerName.includes(searchLower)
		);
	});

	const getOtherUser = (conversation: Conversation) => {
		if (currentUserId === conversation.buyerId) {
			return conversation.seller;
		}
		return conversation.buyer;
	};

	const getLastMessagePreview = (conversation: Conversation) => {
		if (
			conversation.lastMessage &&
			conversation.lastMessage.messageType !== "image" &&
			conversation.lastMessage.messageType !== "mixed" &&
			conversation.lastMessage.messageType !== "offer"
		) {
			const content = conversation.lastMessage.content;
			return content.length > 50
				? `${content.substring(0, 50)}...`
				: content;
		} else if (
			conversation.lastMessage &&
			conversation.lastMessage.messageType === "offer"
		) {
			return "Offre reçue";
		} else if (
			conversation.lastMessage &&
			(conversation.lastMessage.messageType === "image" ||
				conversation.lastMessage.messageType === "mixed" ||
				conversation.lastMessage.messageType !== "offer")
		) {
			return "Photo reçue";
		} else {
			return "Aucun message";
		}
	};

	const getLastMessageTime = (conversation: Conversation) => {
		if (conversation.lastMessage) {
			return formatDistanceToNow(
				new Date(conversation.lastMessage.createdAt),
				{
					addSuffix: true,
					locale: fr,
				}
			);
		}
		return formatDistanceToNow(new Date(conversation.updatedAt), {
			addSuffix: true,
			locale: fr,
		});
	};

	if (conversations.length === 0) {
		return (
			<div className="p-6">
				<div className="text-center text-gray-500">
					<MessageCircle className="mx-auto h-12 w-12 mb-4 text-gray-300" />
					<p className="text-lg font-medium">Aucune conversation</p>
					<p className="text-sm">
						Commencez à discuter avec des vendeurs ou acheteurs
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			{/* Header avec recherche */}
			<div className="p-4 border-b border-gray-200">
				<h2 className="text-lg font-semibold text-gray-900 mb-3">
					Conversations
				</h2>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Rechercher une conversation..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
			</div>

			{/* Liste des conversations */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-h-[calc(100vh-400px)] overflow-y-auto">
				{filteredConversations.map((conversation) => {
					const otherUser = getOtherUser(conversation);
					const isSelected =
						selectedConversation?.id === conversation.id;
					const isUnread = conversation.unreadCount > 0;

					return (
						<div
							key={conversation.id}
							onClick={() => onConversationSelect(conversation)}
							className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
								isSelected
									? "bg-blue-50 border-l-4 border-l-blue-500"
									: ""
							}`}
						>
							<div className="flex items-start space-x-3">
								{/* Avatar de l'autre utilisateur */}
								<div className="flex-shrink-0">
									<div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
										{otherUser.image ? (
											<Image
												src={otherUser.image}
												alt={otherUser.name}
												className="w-12 h-12 rounded-full object-cover"
												width={48}
												height={48}
											/>
										) : (
											<span className="text-gray-600 font-medium text-lg">
												{otherUser.name
													.charAt(0)
													.toUpperCase()}
											</span>
										)}
									</div>
								</div>

								{/* Contenu de la conversation */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between mb-1">
										<div className="flex items-center space-x-2">
											<h3 className="text-sm font-medium text-gray-900 truncate">
												{otherUser.name}
											</h3>
											{/* Indicateur Achat/Vente */}
											<span
												className={`px-2 py-1 text-xs font-medium rounded-full ${
													currentUserId ===
													conversation.buyerId
														? "bg-green-100 text-green-800"
														: "bg-blue-100 text-blue-800"
												}`}
											>
												{currentUserId ===
												conversation.buyerId
													? "Achat"
													: "Vente"}
											</span>
										</div>
										<span className="text-xs text-gray-500">
											{getLastMessageTime(conversation)}
										</span>
									</div>

									<p className="text-sm text-gray-600 truncate mb-1">
										{conversation.product.title}
									</p>

									<p
										className={`text-sm truncate ${
											isUnread
												? "text-gray-900 font-medium"
												: "text-gray-500"
										}`}
									>
										{getLastMessagePreview(conversation)}
									</p>
								</div>

								{/* Indicateur de messages non lus */}
								{isUnread && (
									<div className="flex-shrink-0">
										<div className="w-3 h-3 bg-blue-500 rounded-full"></div>
									</div>
								)}
							</div>
						</div>
					);
					})}
				</div>
			</div>
		</div>
	);
}
