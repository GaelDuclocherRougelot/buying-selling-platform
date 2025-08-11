"use client";

import { Conversation, Message } from "@/types/conversation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Image as ImageIcon, Send, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import CreateOfferForm from "./CreateOfferForm";
import OfferMessage from "./OfferMessage";

interface ChatWindowProps {
	conversation: Conversation;
	currentUserId?: string;
	onSendMessage: (
		conversationId: string,
		content: string,
		messageType?: "text" | "image" | "file" | "mixed"
	) => void;
	loading?: boolean;
	typingUsers: Set<string>;
	onTypingStatusChange: (conversationId: string, isTyping: boolean) => void;
}

export default function ChatWindow({
	conversation,
	currentUserId,
	onSendMessage,
	loading = false,
	typingUsers,
	onTypingStatusChange,
}: ChatWindowProps) {
	const [newMessage, setNewMessage] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [selectedImages, setSelectedImages] = useState<File[]>([]);
	const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [messages, setMessages] = useState<Message[]>(
		conversation.messages || []
	);
	const [showOfferForm, setShowOfferForm] = useState(false);
	const typingTimeoutRef = useRef<NodeJS.Timeout>();

	useEffect(() => {
		// Mettre à jour les messages quand la conversation change
		setMessages(conversation.messages || []);
	}, [conversation.messages]);

	useEffect(() => {
		// Scroll vers le bas quand de nouveaux messages arrivent
		scrollToBottom();
	}, [messages]);

	// Gérer l'état de frappe
	useEffect(() => {
		if (isTyping) {
			onTypingStatusChange(conversation.id, true);

			// Arrêter la frappe après 2 secondes d'inactivité
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}

			typingTimeoutRef.current = setTimeout(() => {
				setIsTyping(false);
				onTypingStatusChange(conversation.id, false);
			}, 2000);
		} else {
			onTypingStatusChange(conversation.id, false);
		}

		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
		};
	}, [isTyping, conversation.id, onTypingStatusChange]);

	// Nettoyer les URLs de preview quand les images changent
	useEffect(() => {
		return () => {
			imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
		};
	}, [imagePreviewUrls]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const handleSendMessage = () => {
		if ((newMessage.trim() || selectedImages.length > 0) && currentUserId) {
			// Si on a du texte ET des images, créer un message mixte
			if (newMessage.trim() && selectedImages.length > 0) {
				handleSendMixedMessage();
			}
			// Si on a seulement des images, les envoyer
			else if (selectedImages.length > 0) {
				handleSendImages();
			}
			// Si on a seulement du texte, l'envoyer
			else if (newMessage.trim()) {
				onSendMessage(conversation.id, newMessage.trim(), "text");
				setNewMessage("");
				setIsTyping(false);
			}
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setNewMessage(e.target.value);
		if (!isTyping) {
			setIsTyping(true);
		}
	};

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		const imageFiles = files.filter((file) =>
			file.type.startsWith("image/")
		);

		if (imageFiles.length === 0) return;

		// Limiter à 5 images maximum
		const totalImages = selectedImages.length + imageFiles.length;
		if (totalImages > 5) {
			alert("Vous ne pouvez sélectionner que 5 images maximum");
			return;
		}

		setSelectedImages((prev) => [...prev, ...imageFiles]);

		// Créer les URLs de preview
		imageFiles.forEach((file) => {
			const url = URL.createObjectURL(file);
			setImagePreviewUrls((prev) => [...prev, url]);
		});

		// Réinitialiser l'input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const removeImage = (index: number) => {
		setSelectedImages((prev) => prev.filter((_, i) => i !== index));
		setImagePreviewUrls((prev) => {
			const newUrls = [...prev];
			URL.revokeObjectURL(newUrls[index]);
			newUrls.splice(index, 1);
			return newUrls;
		});
	};

	const handleSendImages = async () => {
		if (selectedImages.length === 0) return;

		setUploadingImages(true);

		try {
			const formData = new FormData();
			selectedImages.forEach((file) => {
				formData.append("files", file);
			});

			const response = await fetch("/api/upload/messages", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				throw new Error("Erreur lors de l'upload des images");
			}

			const { urls } = await response.json();

			// Envoyer chaque image comme un message séparé
			for (const url of urls) {
				await onSendMessage(conversation.id, url, "image");
			}

			// Nettoyer
			setSelectedImages([]);
			setImagePreviewUrls([]);
			setUploadingImages(false);
		} catch (error) {
			console.error("Erreur upload:", error);
			alert("Erreur lors de l'envoi des images");
			setUploadingImages(false);
		}
	};

	const handleSendMixedMessage = async () => {
		if (selectedImages.length === 0 || !newMessage.trim()) return;

		setUploadingImages(true);

		try {
			const formData = new FormData();
			selectedImages.forEach((file) => {
				formData.append("files", file);
			});

			const response = await fetch("/api/upload/messages", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				throw new Error("Erreur lors de l'upload des images");
			}

			const { urls } = await response.json();

			// Créer un message mixte avec le texte et les images
			const mixedContent = {
				text: newMessage.trim(),
				images: urls,
			};

			// Envoyer le message mixte
			await onSendMessage(
				conversation.id,
				JSON.stringify(mixedContent),
				"mixed"
			);

			// Nettoyer
			setNewMessage("");
			setSelectedImages([]);
			setImagePreviewUrls([]);
			setUploadingImages(false);
			setIsTyping(false);
		} catch (error) {
			console.error("Erreur upload:", error);
			alert("Erreur lors de l'envoi du message mixte");
		}
	};

	const handleOfferCreated = () => {
		// Rafraîchir les messages pour afficher la nouvelle offre
		setMessages([...conversation.messages]);
	};

	const handleOfferUpdate = () => {
		// Rafraîchir les messages pour afficher les mises à jour des offres
		setMessages([...conversation.messages]);
	};

	const getOtherUser = () => {
		if (currentUserId === conversation.buyerId) {
			return conversation.seller;
		}
		return conversation.buyer;
	};

	const isCurrentUser = (message: Message) => {
		return message.senderId === currentUserId;
	};

	const formatMessageTime = (date: string) => {
		return formatDistanceToNow(new Date(date), {
			addSuffix: true,
			locale: fr,
		});
	};

	const renderMessageContent = (message: Message) => {
		// Messages d'offre
		if (message.messageType === "offer") {
			return (
				<OfferMessage
					message={message}
					currentUserId={currentUserId}
					onOfferUpdate={handleOfferUpdate}
					conversation={conversation}
				/>
			);
		}

		// Messages de réponse aux offres
		if (message.messageType === "offer_response") {
			return (
				<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
					<p className="text-sm text-gray-700">{message.content}</p>
					<div className="flex items-center justify-start gap-2 mt-2">
						<p
							className={`text-xs ${
								isCurrentUser(message)
									? "text-blue-100"
									: "text-gray-500"
							}`}
						>
							{formatMessageTime(message.createdAt)}
						</p>
						{message.isRead && isCurrentUser(message) && (
							<p className="text-xs text-blue-100">✓ Lu</p>
						)}
					</div>
				</div>
			);
		}

		if (message.messageType === "image") {
			return (
				<div className="space-y-2">
					<div className="relative group">
						<Image
							src={message.content}
							alt="Image du message"
							width={300}
							height={300}
							className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
							onClick={() =>
								window.open(message.content, "_blank")
							}
						/>
					</div>
					<div className="flex items-center justify-start gap-2">
						<p
							className={`text-xs mt-1 ${
								isCurrentUser(message)
									? "text-blue-100"
									: "text-gray-500"
							}`}
						>
							{formatMessageTime(message.createdAt)}
						</p>
						{message.isRead && isCurrentUser(message) && (
							<p className="text-xs text-blue-100 mt-1">✓ Lu</p>
						)}
					</div>
				</div>
			);
		}

		if (message.messageType === "mixed") {
			try {
				const mixedContent = JSON.parse(message.content);
				return (
					<div className="space-y-3">
						{/* Texte du message */}
						<p className="text-sm">{mixedContent.text}</p>

						{/* Images du message */}
						<div className="grid grid-cols-1 gap-2">
							{mixedContent.images.map(
								(imageUrl: string, index: number) => (
									<div key={index} className="relative group">
										<Image
											src={imageUrl}
											alt={`Image ${index + 1} du message`}
											width={300}
											height={300}
											className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
											onClick={() =>
												window.open(imageUrl, "_blank")
											}
										/>
									</div>
								)
							)}
						</div>

						{/* Métadonnées du message */}
						<div className="flex items-center justify-start gap-2">
							<p
								className={`text-xs mt-1 ${
									isCurrentUser(message)
										? "text-blue-100"
										: "text-gray-500"
								}`}
							>
								{formatMessageTime(message.createdAt)}
							</p>
							{message.isRead && isCurrentUser(message) && (
								<p className="text-xs text-blue-100 mt-1">
									✓ Lu
								</p>
							)}
						</div>
					</div>
				);
			} catch {
				// Fallback si le parsing échoue
				return (
					<>
						<p className="text-sm text-red-500">
							Erreur d&apos;affichage du message mixte
						</p>
						<p
							className={`text-xs mt-1 ${
								isCurrentUser(message)
									? "text-blue-100"
									: "text-gray-500"
							}`}
						>
							{formatMessageTime(message.createdAt)}
						</p>
					</>
				);
			}
		}

		// Message texte normal
		return (
			<>
				<p className="text-sm">{message.content}</p>
				<div className="flex items-center justify-start gap-2">
					<p
						className={`text-xs mt-1 ${
							isCurrentUser(message)
								? "text-blue-100"
								: "text-gray-500"
						}`}
					>
						{formatMessageTime(message.createdAt)}
					</p>
					{message.isRead && isCurrentUser(message) && (
						<p className="text-xs text-blue-100 mt-1">✓ Lu</p>
					)}
				</div>
			</>
		);
	};

	return (
		<div className="h-full flex flex-col">
			{/* Header de la conversation */}
			<div className="p-4 border-b border-gray-200 bg-gray-50">
				<div className="flex items-center space-x-3">
					<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
						{getOtherUser().image ? (
							<Image
								src={getOtherUser().image || ""}
								alt={getOtherUser().name}
								className="w-10 h-10 rounded-full object-cover"
								width={40}
								height={40}
							/>
						) : (
							<span className="text-gray-600 font-medium">
								{getOtherUser().name.charAt(0).toUpperCase()}
							</span>
						)}
					</div>
					<div className="flex-1">
						<div className="flex items-center space-x-2 mb-1">
							<h3 className="font-medium text-gray-900">
								{getOtherUser().name}
							</h3>
							{/* Indicateur Achat/Vente */}
							<span
								className={`px-2 py-1 text-xs font-medium rounded-full ${
									currentUserId === conversation.buyerId
										? "bg-green-100 text-green-800"
										: "bg-blue-100 text-blue-800"
								}`}
							>
								{currentUserId === conversation.buyerId
									? "Achat"
									: "Vente"}
							</span>
						</div>
						<p className="text-sm text-gray-600">
							{conversation.product.title}
						</p>
					</div>
					<div className="text-right">
						<div className="flex flex-col items-end space-y-2">
							<p className="text-sm font-medium text-gray-900">
								{conversation.product.price.toFixed(2)} €
							</p>
							<button
								onClick={() => setShowOfferForm(true)}
								className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors flex items-center space-x-1"
							>
								<span>Faire une offre</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Zone des messages */}
			<div className="flex-1 p-4 space-y-4 overflow-y-scroll">
				{loading ? (
					<div className="flex items-center justify-center h-full">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
							<p className="text-gray-500">
								Chargement des messages...
							</p>
						</div>
					</div>
				) : messages.length === 0 ? (
					<div className="text-center text-gray-500 py-8">
						<p>Aucun message pour le moment</p>
						<p className="text-sm">Commencez la conversation !</p>
					</div>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							className={`flex ${isCurrentUser(message) ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
									isCurrentUser(message)
										? "bg-blue-500 text-white"
										: "bg-gray-200 text-gray-900"
								}`}
							>
								{renderMessageContent(message)}
							</div>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Indicateur de frappe des autres utilisateurs */}
			{Array.from(typingUsers).filter((id) => id !== currentUserId)
				.length > 0 && (
				<div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
					<div className="flex items-center space-x-2">
						<div className="flex space-x-1">
							<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
							<div
								className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
								style={{ animationDelay: "0.1s" }}
							></div>
							<div
								className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
								style={{ animationDelay: "0.2s" }}
							></div>
						</div>
						<span className="text-sm text-gray-500">
							{Array.from(typingUsers).filter(
								(id) => id !== currentUserId
							).length === 1
								? `${getOtherUser().name} est en train d'écrire...`
								: `${Array.from(typingUsers).filter((id) => id !== currentUserId).length} utilisateurs sont en train d'écrire...`}
						</span>
					</div>
				</div>
			)}

			{/* Prévisualisation des images sélectionnées */}
			{selectedImages.length > 0 && (
				<div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
					<div className="flex items-center space-x-2 mb-2">
						<span className="text-sm font-medium text-gray-700">
							Images sélectionnées ({selectedImages.length}/5)
						</span>
						<button
							onClick={() => {
								setSelectedImages([]);
								setImagePreviewUrls([]);
							}}
							className="text-sm text-red-500 hover:text-red-700"
						>
							Tout supprimer
						</button>
					</div>
					<div className="flex space-x-2 overflow-x-auto">
						{imagePreviewUrls.map((url, index) => (
							<div key={index} className="relative flex-shrink-0">
								<Image
									src={url}
									alt={`Preview ${index + 1}`}
									width={80}
									height={80}
									className="w-20 h-20 object-cover rounded-lg"
								/>
								<button
									onClick={() => removeImage(index)}
									className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Zone de saisie */}
			<div className="p-4 border-t border-gray-200">
				<div className="flex items-center justify-center space-x-2">
					<div className="flex-1 relative">
						<textarea
							value={newMessage}
							onChange={handleInputChange}
							onKeyPress={handleKeyPress}
							placeholder="Tapez votre message..."
							className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							rows={1}
							style={{ minHeight: "44px", maxHeight: "120px" }}
						/>
					</div>

					<div className="flex space-x-2">
						{/* Bouton d'upload d'images */}
						<button
							onClick={() => fileInputRef.current?.click()}
							disabled={selectedImages.length >= 5}
							className="p-2 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
							title="Ajouter des images (max 5)"
						>
							<ImageIcon className="w-5 h-5" />
						</button>

						{/* Input file caché */}
						<input
							ref={fileInputRef}
							type="file"
							multiple
							accept="image/*"
							onChange={handleImageSelect}
							className="hidden"
						/>

						{/* Bouton d'envoi */}
						<button
							onClick={handleSendMessage}
							disabled={
								(!newMessage.trim() &&
									selectedImages.length === 0) ||
								uploadingImages
							}
							className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						>
							{uploadingImages ? (
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
							) : (
								<Send className="w-5 h-5" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Modal de création d'offre */}
			{showOfferForm && (
				<CreateOfferForm
					conversation={conversation}
					currentUserId={currentUserId}
					onOfferCreated={handleOfferCreated}
					onClose={() => setShowOfferForm(false)}
				/>
			)}
		</div>
	);
}
