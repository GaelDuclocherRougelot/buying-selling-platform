"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import BuyerValidateButton from "./BuyerValidateButton";

interface BuyerValidationProps {
	paymentId: string;
	productTitle: string;
	amount: number;
	onValidated: () => void;
}

export default function BuyerValidation({
	paymentId,
	productTitle,
	amount,
	onValidated,
}: BuyerValidationProps) {
	const [loading, setLoading] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [showRejectForm, setShowRejectForm] = useState(false);

	const handleAction = async (action: "accept" | "reject") => {
		setLoading(true);
		try {
			const response = await apiFetch(
				`/api/payments/${paymentId}/buyer-validation`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						action,
						reason: action === "reject" ? rejectReason : undefined,
					}),
				}
			);

			if (response.ok) {
				const result = await response.json();
				console.log("✅ Validation réussie:", result.message);
				onValidated();
			} else {
				const error = await response.json();
				console.error("❌ Erreur de validation:", error.error);
				alert(`Erreur: ${error.error}`);
			}
		} catch (error) {
			console.error("❌ Erreur réseau:", error);
			alert("Erreur de connexion. Veuillez réessayer.");
		} finally {
			setLoading(false);
		}
	};

	const handleAccept = () => {
		if (
			confirm("Confirmez-vous que le produit correspond à vos attentes ?")
		) {
			handleAction("accept");
		}
	};

	const handleReject = () => {
		if (!rejectReason.trim()) {
			alert("Veuillez préciser la raison du rejet.");
			return;
		}
		if (
			confirm(
				"Confirmez-vous le rejet de ce produit ? Cette action est irréversible."
			)
		) {
			handleAction("reject");
		}
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					🤝 Validation de la remise en main propre
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Informations du produit */}
				<div className="bg-gray-50 p-4 rounded-lg">
					<h3 className="font-semibold text-lg mb-2">
						{productTitle}
					</h3>
					<p className="text-gray-600">Montant: {amount}€</p>
				</div>

				{/* Instructions */}
				<div className="bg-blue-50 p-4 rounded-lg">
					<h4 className="font-semibold text-blue-800 mb-2">
						📋 Instructions
					</h4>
					<p className="text-blue-700 text-sm">
						Vous avez reçu ce produit en main propre. Veuillez
						maintenant valider si le produit correspond bien à vos
						attentes et à la description de l&apos;annonce.
					</p>
				</div>

				{!showRejectForm ? (
					/* Boutons d'action */
					<div className="space-y-4">
						{/* Bouton de validation rapide */}
						<div className="flex justify-center">
							<BuyerValidateButton
								paymentId={paymentId}
								productTitle={productTitle}
								amount={amount}
								onValidated={onValidated}
								disabled={loading}
							/>
						</div>

						{/* Ou utiliser les boutons détaillés */}
						<div className="text-center text-sm text-gray-500">
							Ou utilisez les options détaillées ci-dessous :
						</div>

						<div className="flex gap-4">
							<Button
								onClick={handleAccept}
								disabled={loading}
								className="flex-1 bg-green-600 hover:bg-green-700"
							>
								{loading ? "⏳" : "✅"} Accepter le produit
							</Button>
							<Button
								onClick={() => setShowRejectForm(true)}
								disabled={loading}
								variant="destructive"
								className="flex-1"
							>
								❌ Refuser le produit
							</Button>
						</div>
					</div>
				) : (
					/* Formulaire de rejet */
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-2">
								Raison du refus *
							</label>
							<Textarea
								value={rejectReason}
								onChange={(e) =>
									setRejectReason(e.target.value)
								}
								placeholder="Expliquez pourquoi le produit ne correspond pas à vos attentes..."
								rows={4}
								required
							/>
						</div>
						<div className="flex gap-4">
							<Button
								onClick={() => setShowRejectForm(false)}
								variant="outline"
								className="flex-1"
								disabled={loading}
							>
								Annuler
							</Button>
							<Button
								onClick={handleReject}
								disabled={loading || !rejectReason.trim()}
								variant="destructive"
								className="flex-1"
							>
								{loading
									? "⏳ Traitement..."
									: "Confirmer le refus"}
							</Button>
						</div>
					</div>
				)}

				{/* Information importante */}
				<div className="bg-yellow-50 p-4 rounded-lg">
					<p className="text-yellow-800 text-sm">
						<strong>⚠️ Important :</strong> Une fois votre choix
						validé, il ne peut plus être modifié. En cas
						d&apos;acceptation, le paiement sera transféré au vendeur. En
						cas de refus, vous serez remboursé intégralement.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
