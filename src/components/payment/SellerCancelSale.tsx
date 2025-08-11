"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface SellerCancelSaleProps {
	paymentId: string;
	productTitle: string;
	buyerName: string;
	amount: number;
	onCancelled: () => void;
}

export default function SellerCancelSale({
	paymentId,
	productTitle,
	buyerName,
	amount,
	onCancelled,
}: SellerCancelSaleProps) {
	const [loading, setLoading] = useState(false);
	const [reason, setReason] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleCancel = async () => {
		if (!reason.trim() || reason.trim().length < 10) {
			alert(
				"Veuillez fournir une raison détaillée (minimum 10 caractères)."
			);
			return;
		}

		setLoading(true);
		try {
			const response = await apiFetch(
				`/api/payments/${paymentId}/seller-cancel`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						reason: reason.trim(),
					}),
				}
			);

			if (response.ok) {
				const result = await response.json();
				console.log("✅ Annulation réussie:", result.message);
				setIsDialogOpen(false);
				onCancelled();
			} else {
				const error = await response.json();
				console.error("❌ Erreur d'annulation:", error.error);
				alert(`Erreur: ${error.error}`);
			}
		} catch (error) {
			console.error("❌ Erreur réseau:", error);
			alert("Erreur de connexion. Veuillez réessayer.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full border-red-200">
			<CardHeader className="bg-red-50">
				<CardTitle className="flex items-center gap-2 text-red-800">
					<AlertTriangle className="h-5 w-5" />
					Zone de gestion vendeur
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-6">
				{/* Informations de la vente */}
				<div className="mb-4 p-4 bg-gray-50 rounded-lg">
					<h3 className="font-semibold mb-2">{productTitle}</h3>
					<div className="text-sm text-gray-600 space-y-1">
						<p>Acheteur: {buyerName}</p>
						<p>Montant: {amount}€</p>
					</div>
				</div>

				{/* Bouton d'annulation */}
				<AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<AlertDialogTrigger asChild>
						<Button
							variant="destructive"
							className="w-full"
							disabled={loading}
						>
							🚫 Annuler cette vente
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								Confirmer l&apos;annulation de la vente
							</AlertDialogTitle>
							<AlertDialogDescription className="space-y-3">
								<p>
									Vous êtes sur le point d&apos;annuler la vente de
									&quot;{productTitle}&quot; à {buyerName} pour {amount}
									€.
								</p>
								<p className="text-red-600 font-medium">
									⚠️ Cette action est irréversible. L&apos;acheteur
									sera immédiatement remboursé et le produit
									sera remis en vente.
								</p>
							</AlertDialogDescription>
						</AlertDialogHeader>

						<div className="my-4">
							<label className="block text-sm font-medium mb-2">
								Raison de l&apos;annulation *
							</label>
							<Textarea
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="Expliquez pourquoi vous annulez cette vente (problème avec l&apos;acheteur, produit endommagé, etc.)..."
								rows={4}
								required
							/>
							<p className="text-xs text-gray-500 mt-1">
								Minimum 10 caractères requis
							</p>
						</div>

						<AlertDialogFooter>
							<AlertDialogCancel disabled={loading}>
								Garder la vente
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleCancel}
								disabled={loading || reason.trim().length < 10}
								className="bg-red-600 hover:bg-red-700"
							>
								{loading
									? "⏳ Annulation..."
									: "Confirmer l'annulation"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Informations importantes */}
				<div className="mt-4 p-4 bg-yellow-50 rounded-lg">
					<h4 className="font-semibold text-yellow-800 mb-2">
						📋 Quand utiliser cette fonction ?
					</h4>
					<ul className="text-sm text-yellow-700 space-y-1">
						<li>• L&apos;acheteur ne se présente pas au rendez-vous</li>
						<li>• Problème de communication avec l&apos;acheteur</li>
						<li>• Produit endommagé depuis la vente</li>
						<li>• Toute situation empêchant la finalisation</li>
					</ul>
				</div>

				<div className="mt-4 p-4 bg-red-50 rounded-lg">
					<p className="text-sm text-red-700">
						<strong>⚠️ Attention :</strong> L&apos;annulation d&apos;une vente
						peut affecter votre réputation de vendeur. Utilisez
						cette fonction uniquement en cas de nécessité absolue.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
