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
import { apiFetch } from "@/lib/api";
import { CheckCircle } from "lucide-react";
import { useState } from "react";

interface BuyerValidateButtonProps {
	paymentId: string;
	productTitle: string;
	amount: number;
	onValidated: () => void;
	disabled?: boolean;
}

export default function BuyerValidateButton({
	paymentId,
	productTitle,
	amount,
	onValidated,
	disabled = false,
}: BuyerValidateButtonProps) {
	const [loading, setLoading] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleValidate = async () => {
		setLoading(true);
		try {
			const response = await apiFetch(
				`/api/payments/${paymentId}/buyer-validate`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (response.ok) {
				const result = await response.json();
				console.log("✅ Validation réussie:", result.message);
				setIsDialogOpen(false);
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

	return (
		<AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
				<Button variant="default" disabled={disabled || loading} className="w-fit cursor-pointer">
					<CheckCircle className="h-4 w-4 mr-2" />
					Valider la transaction
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Confirmer la validation de la vente
					</AlertDialogTitle>
					<AlertDialogDescription className="space-y-3">
						<p>
							Vous confirmez avoir reçu &ldquo;{productTitle}
							&rdquo; et que le produit correspond à vos attentes.
						</p>
						<p className="text-green-600 font-medium">
							✅ Le paiement de {amount}€ sera immédiatement
							transféré au vendeur.
						</p>
						<p className="text-gray-600">
							Cette action finalise définitivement la transaction.
						</p>
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>
						Annuler
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleValidate}
                        disabled={loading}
						className="bg-green-600 hover:bg-green-700 cursor-pointer"
					>
						{loading
							? "⏳ Validation..."
							: "Confirmer la transaction"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
