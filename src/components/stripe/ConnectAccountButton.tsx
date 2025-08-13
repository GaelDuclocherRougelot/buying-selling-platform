"use client";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { useState } from "react";
import { toast } from "sonner";

interface ConnectAccountButtonProps {
	mode?: "create" | "onboarding";
	className?: string;
}

export default function ConnectAccountButton({
	mode = "create",
	className,
}: ConnectAccountButtonProps) {
	const { data: session } = useSession();
	const [loading, setLoading] = useState(false);
	const { handleError, handleApiError } = useErrorHandler();

	const handleConnectAccount = async () => {
		if (!session?.user) {
			handleError("Vous devez être connecté", {
				showToast: true,
				logToConsole: true,
			});
			return;
		}

		setLoading(true);
		try {
			if (mode === "create") {
				// Créer le compte Stripe s'il n'existe pas
				const createResponse = await apiFetch(
					"/api/stripe/connect/create-account",
					{
						method: "POST",
					}
				);

				const createData = await createResponse.json();

				if (!createResponse.ok) {
					// Gérer l'erreur de profil plateforme
					if (createData.error === "PLATFORM_PROFILE_REQUIRED") {
						handleError("Configuration requise", {
							fallbackMessage:
								"Le profil de plateforme Stripe doit être configuré. Vérifiez la console pour les instructions.",
							showToast: true,
							logToConsole: true,
						});

						// Afficher les instructions dans la console
						console.log(
							"🚨 Configuration du profil plateforme requise:"
						);
						console.log("📋 Instructions:");
						createData.instructions?.forEach(
							(instruction: string) => {
								console.log(`   ${instruction}`);
							}
						);

						return; // Arrêter ici, ne pas continuer vers l'onboarding
					}

					// Gérer les erreurs Stripe
					if (createData.error === "STRIPE_ERROR") {
						handleError("Erreur Stripe", {
							fallbackMessage:
								createData.message ||
								"Erreur lors de la création du compte Stripe",
							showToast: true,
							logToConsole: true,
						});
						return;
					}

					if (
						createData.error !== "User already has a Stripe account"
					) {
						handleError("Erreur", {
							fallbackMessage:
								createData.error || "Erreur inconnue",
							showToast: true,
							logToConsole: true,
						});
						return;
					}
				}

				// Seulement continuer vers l'onboarding si la création a réussi
				if (createData.needsOnboarding) {
					// Rediriger vers l'onboarding
					const linkResponse = await apiFetch(
						"/api/stripe/connect/account-link",
						{
							method: "POST",
						}
					);

					if (!linkResponse.ok) {
						handleApiError(
							linkResponse,
							"Erreur lors de la création du lien de compte"
						);
						return;
					}

					const { url } = await linkResponse.json();
					window.location.href = url;
				} else {
					// Le compte est déjà actif
					toast.success("Compte Stripe créé avec succès !");
					window.location.reload();
				}
			} else {
				// Mode onboarding - rediriger directement
				const linkResponse = await apiFetch(
					"/api/stripe/connect/account-link",
					{
						method: "POST",
					}
				);

				if (!linkResponse.ok) {
					handleApiError(
						linkResponse,
						"Erreur lors de la création du lien de compte"
					);
					return;
				}

				const { url } = await linkResponse.json();
				window.location.href = url;
			}
		} catch (error) {
			handleError(error, {
				fallbackMessage: "Erreur lors de la connexion du compte",
				showToast: true,
				logToConsole: true,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			onClick={handleConnectAccount}
			disabled={loading}
			className={className}
		>
			{loading
				? "Traitement..."
				: mode === "create"
					? "Créer un compte vendeur"
					: "Compléter le profil"}
		</Button>
	);
}
