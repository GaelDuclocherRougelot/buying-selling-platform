"use client";
import PaymentButton from "@/components/stripe/PaymentButton";
import { Conversation, Message } from "@/types/conversation";
import { Check, Clock, Euro, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OfferMessageProps {
	message: Message;
	currentUserId?: string;
	onOfferUpdate: () => void;
	conversation: Conversation;
}

export default function OfferMessage({
	message,
	currentUserId,
	onOfferUpdate,
	conversation,
}: OfferMessageProps) {
	const [isResponding, setIsResponding] = useState(false);
	const [showDetails, setShowDetails] = useState(false);

	if (message.offer === null) {
		return (
			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
				<p className="text-sm text-yellow-800">
					Erreur d&apos;affichage de l&apos;offre
				</p>
			</div>
		);
	}

	const isCurrentUser = message.senderId === currentUserId;
	const canRespond = !isCurrentUser && message.offer?.status === "pending";

	const handleRespondToOffer = async (response: "accepted" | "rejected") => {
		if (!canRespond) return;

		setIsResponding(true);
		try {
			const res = await fetch(
				`/api/messages/offers/${message.offer?.id}/respond`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ response }),
				}
			);

			if (res.ok) {
				toast.success(
					response === "accepted"
						? "Offre acceptée ! Commande créée."
						: "Offre refusée."
				);
				onOfferUpdate();
			} else {
				const error = await res.json();
				toast.error(
					error.error || "Erreur lors de la réponse à l'offre"
				);
			}
		} catch (error) {
			console.error("Erreur:", error);
			toast.error("Erreur lors de la réponse à l'offre");
		} finally {
			setIsResponding(false);
		}
	};

	const getStatusIcon = () => {
		switch (message.offer?.status) {
			case "accepted":
				return <Check className="w-4 h-4 text-green-600" />;
			case "rejected":
				return <X className="w-4 h-4 text-red-600" />;
			case "expired":
				return <Clock className="w-4 h-4 text-gray-600" />;
			default:
				return <Clock className="w-4 h-4 text-blue-600" />;
		}
	};

	const getStatusText = () => {
		switch (message.offer?.status) {
			case "accepted":
				return "Acceptée";
			case "rejected":
				return "Refusée";
			case "expired":
				return "Expirée";
			default:
				return "En attente";
		}
	};

	const getStatusColor = () => {
		switch (message.offer?.status) {
			case "accepted":
				return "bg-green-100 text-green-800 border-green-200";
			case "rejected":
				return "bg-red-100 text-red-800 border-red-200";
			case "expired":
				return "bg-gray-100 text-gray-800 border-gray-200";
			default:
				return "bg-blue-100 text-blue-800 border-blue-200";
		}
	};

	return (
		<div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
			{/* En-tête de l'offre */}
			<div className="flex items-center justify-between mb-3 gap-2">
				<div className="flex items-center gap-1">
					<Euro className="w-5 h-5 text-green-600" />
					<span className="font-semibold text-lg text-gray-900">
						{message.offer?.amount.toFixed(2)}€
					</span>
				</div>
				<div
					className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
				>
					<div className="flex items-center gap-1">
						{getStatusIcon()}
						<span>{getStatusText()}</span>
					</div>
				</div>
			</div>

			{/* Message de l'offre */}
			{message.offer?.message && (
				<div className="mb-3">
					<p className="text-sm text-gray-700">
						{message.offer?.message}
					</p>
				</div>
			)}

			{/* Boutons d'action */}
			{canRespond && (
				<div className="flex space-x-2">
					<button
						onClick={() => handleRespondToOffer("accepted")}
						disabled={isResponding}
						className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
					>
						<Check className="w-4 h-4" />
						<span>Accepter</span>
					</button>
					<button
						onClick={() => handleRespondToOffer("rejected")}
						disabled={isResponding}
						className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
					>
						<X className="w-4 h-4" />
						<span>Refuser</span>
					</button>
				</div>
			)}

			{/* PaymentButton quand l'offre est acceptée */}
			{/* Affiche le bouton de paiement uniquement pour l'acheteur (non-expéditeur) quand l'offre est acceptée */}
			{message.offer?.status === "accepted" && isCurrentUser && (
				<div className="mt-3 pt-3 border-t border-gray-100">
					<div className="text-center">
						<p className="text-sm text-green-700 mb-3">
							🎉 Offre acceptée ! Vous pouvez maintenant procéder
							au paiement.
						</p>
						<PaymentButton
							productId={conversation.product.id}
							amount={message.offer.amount}
							productTitle={conversation.product.title}
						/>
					</div>
				</div>
			)}

			{/* Informations supplémentaires */}
			<div className="mt-3 pt-3 border-t border-gray-100">
				<div className="flex items-center justify-between text-xs text-gray-500">
					<span>Expire dans 7 jours</span>
					<button
						onClick={() => setShowDetails(!showDetails)}
						className="text-blue-600 hover:text-blue-800"
					>
						{showDetails ? "Masquer" : "Détails"}
					</button>
				</div>
			</div>

			{/* Détails de l'offre */}
			{showDetails && (
				<div className="mt-3 pt-3 border-t border-gray-100">
					<div className="text-xs text-gray-600 space-y-1">
						<p>ID de l&apos;offre: {message.offer?.id}</p>
						<p>
							Envoyée le:{" "}
							{new Date(message.createdAt).toLocaleDateString(
								"fr-FR"
							)}
						</p>
						<p>Par: {message.sender.name}</p>
					</div>
				</div>
			)}
		</div>
	);
}
