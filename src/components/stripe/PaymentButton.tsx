"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

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

	const handlePayment = async () => {
		if (!session?.user) {
			toast.error("Vous devez être connecté pour effectuer un achat");
			return;
		}

		setLoading(true);
		try {
			// Créer une session de paiement Stripe Checkout
			const response = await fetch(
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
				const error = await response.json();
				console.error("Checkout session error:", error);
				throw new Error(
					error.error ||
						"Erreur lors de la création de la session de paiement"
				);
			}

			const { url } = await response.json();

			// Rediriger vers Stripe Checkout
			if (url) {
				window.location.href = url;
			} else {
				throw new Error("URL de paiement manquante");
			}
		} catch (error) {
			console.error("Payment error:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Erreur lors du paiement"
			);
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
