"use client";

import { apiFetch } from "@/lib/api";
import { Conversation } from "@/types/conversation";
import { Euro, Send, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateOfferFormProps {
	conversation: Conversation;
	currentUserId?: string;
	onOfferCreated: () => void;
	onClose: () => void;
}

export default function CreateOfferForm({
	conversation,
	currentUserId,
	onOfferCreated,
	onClose,
}: CreateOfferFormProps) {
	const [amount, setAmount] = useState("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const originalPrice = conversation.product.price;
	const maxAmount = originalPrice - 0.01; // L'offre doit être inférieure au prix original

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!amount || !currentUserId) return;

		const offerAmount = parseFloat(amount);
		if (offerAmount <= 0 || offerAmount >= originalPrice) {
			toast.error(
				"Le montant de l'offre doit être inférieur au prix original et supérieur à 0"
			);
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await apiFetch("/api/messages/offers", {
				method: "POST",
				body: JSON.stringify({
					conversationId: conversation.id,
					amount: offerAmount,
					message: message.trim() || undefined,
				}),
			});

			if (response.ok) {
				toast.success("Offre envoyée avec succès !");
				onOfferCreated();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || "Erreur lors de l'envoi de l'offre");
			}
		} catch (error) {
			console.error("Erreur:", error);
			toast.error("Erreur lors de l'envoi de l'offre");
		} finally {
			setIsSubmitting(false);
		}
	};

	const getSavings = () => {
		if (!amount) return 0;
		const offerAmount = parseFloat(amount);
		return originalPrice - offerAmount;
	};

	const getSavingsPercentage = () => {
		if (!amount) return 0;
		const savings = getSavings();
		return (savings / originalPrice) * 100;
	};

	return (
		<div className="fixed inset-0 backdrop-blur-lg bg-black/50  flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
				{/* En-tête */}
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-gray-900">
						Faire une offre
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Informations du produit */}
				<div className="mb-4 p-3 bg-gray-50 rounded-lg">
					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-600">
							Prix original:
						</span>
						<span className="font-semibold text-gray-900">
							{originalPrice.toFixed(2)}€
						</span>
					</div>
					<div className="text-xs text-gray-500 mt-1">
						{conversation.product.title}
					</div>
				</div>

				{/* Formulaire */}
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Montant de l'offre */}
					<div>
						<label
							htmlFor="amount"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Montant de votre offre
						</label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Euro className="h-5 w-5 text-gray-400" />
							</div>
							<input
								type="number"
								id="amount"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								min="0.01"
								max={maxAmount}
								step="0.01"
								required
								className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="0.00"
							/>
						</div>
						{amount && (
							<div className="mt-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-600">
										Économies:
									</span>
									<span className="font-medium text-green-600">
										{getSavings().toFixed(2)}€ (
										{getSavingsPercentage().toFixed(1)}%)
									</span>
								</div>
								<div className="text-xs text-gray-500">
									Montant maximum: {maxAmount.toFixed(2)}€
								</div>
							</div>
						)}
					</div>

					{/* Message optionnel */}
					<div>
						<label
							htmlFor="message"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Message (optionnel)
						</label>
						<textarea
							id="message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={3}
							maxLength={200}
							className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
							placeholder="Ajoutez un message pour accompagner votre offre..."
						/>
						<div className="text-xs text-gray-500 text-right mt-1">
							{message.length}/200
						</div>
					</div>

					{/* Informations importantes */}
					<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div className="text-xs text-blue-800 space-y-1">
							<p>• Votre offre expirera dans 7 jours</p>
							<p>
								• L&apos;autre utilisateur pourra accepter ou refuser
							</p>
							<p>
								• Si acceptée, une commande sera automatiquement
								créée
							</p>
						</div>
					</div>

					{/* Boutons */}
					<div className="flex space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Annuler
						</button>
						<button
							type="submit"
							disabled={!amount || isSubmitting}
							className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
						>
							{isSubmitting ? (
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							) : (
								<Send className="w-4 h-4" />
							)}
							<span>Envoyer l&apos;offre</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

