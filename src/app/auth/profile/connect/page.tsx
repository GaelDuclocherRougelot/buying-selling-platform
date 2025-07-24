"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ConnectReturnPage() {
	const { data: session } = useSession();
	const router = useRouter();
	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading"
	);
	const [message, setMessage] = useState("");

	useEffect(() => {
		const handleReturn = async () => {
			if (!session?.user) {
				toast.error("Vous devez être connecté");
				router.push("/auth/login");
				return;
			}

			try {
				// Vérifier le statut du compte Stripe
				const response = await apiFetch(
					"/api/stripe/connect/account-status"
				);

				if (!response.ok) {
					throw new Error("Failed to check account status");
				}

				const data = await response.json();

				if (data.status === "active") {
					setStatus("success");
					setMessage(
						"Votre compte Stripe a été configuré avec succès ! Vous pouvez maintenant vendre des produits."
					);
					toast.success("Compte Stripe activé !");
				} else {
					setStatus("error");
					setMessage(
						"Votre compte Stripe nécessite encore une configuration. Veuillez compléter tous les champs requis."
					);
					toast.error("Configuration incomplète");
				}
			} catch (error) {
				console.error("Error checking account status:", error);
				setStatus("error");
				setMessage(
					"Erreur lors de la vérification du statut de votre compte."
				);
				toast.error("Erreur lors de la vérification");
			}
		};

		handleReturn();
	}, [session, router]);

	const handleContinue = () => {
		router.push("/auth/profile");
	};

	const handleRetryOnboarding = async () => {
		setStatus("loading");
		try {
			const response = await apiFetch(
				"/api/stripe/connect/account-link",
				{
					method: "POST",
				}
			);

			if (!response.ok) {
				throw new Error("Failed to create account link");
			}

			const { url } = await response.json();
			window.location.href = url;
		} catch (error) {
			console.error("Error creating account link:", error);
			toast.error("Erreur lors de la création du lien d'onboarding");
			setStatus("error");
		}
	};

	if (status === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Loader2 className="h-5 w-5 animate-spin" />
							Vérification en cours...
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-gray-600">
							Nous vérifions le statut de votre compte Stripe...
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{status === "success" ? (
							<CheckCircle className="h-5 w-5 text-green-600" />
						) : (
							<AlertCircle className="h-5 w-5 text-orange-600" />
						)}
						{status === "success"
							? "Configuration réussie"
							: "Configuration incomplète"}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-gray-600">{message}</p>

					<div className="flex gap-2">
						<Button onClick={handleContinue} className="flex-1">
							Continuer vers le profil
						</Button>

						{status === "error" && (
							<Button
								onClick={handleRetryOnboarding}
								variant="outline"
								className="flex-1"
							>
								Réessayer
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
