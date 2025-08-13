"use client";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { useState } from "react";

interface PaymentButtonProps {
	productId: string;
	amount: number;
	productTitle: string;
}

export default function PaymentButton({
	productId,
	amount,
	productTitle,
}: PaymentButtonProps) {
	const { data: session } = useSession();
	const [loading, setLoading] = useState(false);
	const { handleError, handleApiError } = useErrorHandler();

	const handlePayment = async () => {
		if (!session?.user) {
			handleError("Vous devez être connecté pour effectuer un achat", {
				showToast: true,
				logToConsole: true,
			});
			return;
		}

		setLoading(true);
		try {
			// Créer une session de paiement Stripe Checkout
			const response = await apiFetch(
				"/api/stripe/checkout/create-session",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						productId,
						amount,
						productTitle,
					}),
				}
			);

			if (!response.ok) {
				handleApiError(
					response,
					"Erreur lors de la création de la session de paiement"
				);
				return;
			}

			const { url } = await response.json();

			// Rediriger vers Stripe Checkout
			if (url) {
				window.location.href = url;
			} else {
				handleError("URL de paiement manquante", {
					showToast: true,
					logToConsole: true,
				});
			}
		} catch (error) {
			handleError(error, {
				fallbackMessage: "Erreur lors du paiement",
				showToast: true,
				logToConsole: true,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button onClick={handlePayment} disabled={loading} className="w-fit">
			{loading ? "Traitement..." : `Acheter pour ${amount}€`}
		</Button>
	);
}
