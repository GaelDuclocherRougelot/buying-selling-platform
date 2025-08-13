
export interface Message {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	messageType:
		| "text"
		| "image"
		| "file"
		| "mixed"
		| "offer"
		| "offer_response";
	isRead: boolean;
	createdAt: string;
	sender: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	// Pour les messages mixtes, on peut avoir des images supplémentaires
	images?: string[];
	// Pour les messages d'offre
	offer?: OfferData;
}

export interface Conversation {
	id: string;
	productId: string;
	buyerId: string;
	sellerId: string;
	createdAt: string;
	updatedAt: string;
	product: {
		id: string;
		title: string;
		imagesUrl: string[];
		price: number;
		status: string;
	};
	buyer: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	seller: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	messages: Message[];
	lastMessage: Message;
	unreadCount: number;
}

export interface CreateConversationRequest {
	productId: string;
	sellerId: string;
}

export interface SendMessageRequest {
	conversationId: string;
	content: string;
	messageType?: "text" | "image" | "file" | "mixed";
	images?: string[];
}

export interface OfferData {
	id: string;
	amount: number;
	currency: string;
	status: "pending" | "accepted" | "rejected" | "expired";
	expiresAt?: string;
	message?: string;
	originalPrice: number;
}

export interface CreateOfferRequest {
	conversationId: string;
	amount: number;
	message?: string;
}

export interface RespondToOfferRequest {
	offerId: string;
	response: "accepted" | "rejected";
}

export interface WebSocketMessage {
	type:
		| "new_message"
		| "message_read"
		| "typing"
		| "user_online"
		| "offer_updated";
	data: unknown;
	conversationId: string;
	senderId: string;
}
