"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";

interface ConnectAccountButtonProps {
	mode?: "create" | "onboard";
	className?: string;
}

export default function ConnectAccountButton({
	mode = "create",
	className,
}: ConnectAccountButtonProps) {
	const { data: session } = useSession();
	const [loading, setLoading] = useState(false);

	const handleConnectAccount = async () => {
		if (!session?.user) {
			toast.error("Vous devez être connecté");
			return;
		}

		setLoading(true);
		try {
			if (mode === "create") {
				// Créer le compte Stripe s'il n'existe pas
				const createResponse = await fetch(
					"/api/stripe/connect/create-account",
					{
						method: "POST",
					}
				);

				const createData = await createResponse.json();

				if (!createResponse.ok) {
					// Gérer l'erreur de profil plateforme
					if (createData.error === "PLATFORM_PROFILE_REQUIRED") {
						toast.error("Configuration requise", {
							description:
								"Le profil de plateforme Stripe doit être configuré. Vérifiez la console pour les instructions.",
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
						toast.error("Erreur Stripe", {
							description:
								createData.message ||
								"Erreur lors de la création du compte Stripe",
						});
						return;
					}

					if (
						createData.error !== "User already has a Stripe account"
					) {
						toast.error("Erreur", {
							description: createData.error || "Erreur inconnue",
						});
						return;
					}
				}

				// Seulement continuer vers l'onboarding si la création a réussi
				if (createData.needsOnboarding) {
					// Rediriger vers l'onboarding
					const linkResponse = await fetch(
						"/api/stripe/connect/account-link",
						{
							method: "POST",
						}
					);

					if (!linkResponse.ok) {
						const linkError = await linkResponse.json();
						console.error("Link creation error:", linkError);
						throw new Error("Failed to create account link");
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
				const linkResponse = await fetch(
					"/api/stripe/connect/account-link",
					{
						method: "POST",
					}
				);

				if (!linkResponse.ok) {
					const linkError = await linkResponse.json();
					console.error("Link creation error:", linkError);
					throw new Error("Failed to create account link");
				}

				const { url } = await linkResponse.json();
				window.location.href = url;
			}
		} catch (error) {
			console.error("Error connecting account:", error);
			toast.error("Erreur lors de la connexion du compte", {
				description:
					error instanceof Error ? error.message : "Erreur inconnue",
			});
		} finally {
			setLoading(false);
		}
	};

	const getButtonText = () => {
		if (loading) {
			return mode === "create" ? "Création..." : "Redirection...";
		}
		return mode === "create"
			? "Créer un compte Stripe"
			: "Compléter la configuration";
	};

	return (
		<Button
			onClick={handleConnectAccount}
			disabled={loading}
			className={className}
		>
			{getButtonText()}
		</Button>
	);
}
