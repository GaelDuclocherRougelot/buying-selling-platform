"use client";

import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./button";

interface FavoriteButtonProps {
	productId: string;
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	size?: "default" | "sm" | "lg" | "icon";
	className?: string;
}

export default function FavoriteButton({
	productId,
	variant = "outline",
	size = "default",
	className,
}: FavoriteButtonProps) {
	const { data: session } = useSession();
	const [isFavorite, setIsFavorite] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { handleError, handleApiError } = useErrorHandler();

	// Check if product is in favorites
	const checkFavoriteStatus = useCallback(async () => {
		try {
			const response = await apiFetch(
				`/api/favorites?userId=${session?.user?.id}`
			);
			if (response.ok) {
				const favorites = await response.json();
				const isInFavorites = favorites.some(
					(fav: { product: { id: string } }) =>
						fav.product.id === productId
				);
				setIsFavorite(isInFavorites);
			}
		} catch (error) {
			handleError(error, {
				fallbackMessage: "Erreur lors de la vérification des favoris",
				showToast: false,
				logToConsole: true,
			});
		}
	}, [productId, handleError, session?.user?.id]);

	// Check if product is in favorites on mount
	useEffect(() => {
		if (session?.user?.id) {
			checkFavoriteStatus();
		}
	}, [session?.user?.id, productId, checkFavoriteStatus]);

	const toggleFavorite = async () => {
		if (!session?.user?.id) {
			handleError("Veuillez vous connecter pour ajouter des favoris", {
				showToast: true,
				logToConsole: true,
			});
			return;
		}

		setIsLoading(true);

		try {
			if (isFavorite) {
				// Remove from favorites
				const response = await apiFetch(`/api/favorites/${productId}`, {
					method: "DELETE",
				});

				if (response.ok) {
					setIsFavorite(false);
					toast.success("Produit retiré des favoris");
				} else {
					handleApiError(
						response,
						"Erreur lors de la suppression du favori"
					);
				}
			} else {
				// Add to favorites
				const response = await apiFetch(
					`/api/favorites`,
					{
						method: "POST",
						body: JSON.stringify({
							productId,
							userId: session?.user?.id,
						}),
					}
				);

				if (response.ok) {
					setIsFavorite(true);
					toast.success("Produit ajouté aux favoris");
				} else {
					const errorData = await response.json();
					if (
						response.status === 400 &&
						errorData.error === "Product already in favorites"
					) {
						setIsFavorite(true);
					} else {
						handleApiError(
							response,
							"Erreur lors de l'ajout aux favoris"
						);
					}
				}
			}
		} catch (error) {
			handleError(error, {
				fallbackMessage: "Erreur lors de la gestion des favoris",
				showToast: true,
				logToConsole: true,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const iconSizes = {
		sm: "h-4 w-4",
		lg: "h-6 w-6",
		default: "h-5 w-5",
		icon: "h-5 w-5",
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={toggleFavorite}
			disabled={isLoading}
			className={cn(
				"transition-all duration-200",
				isFavorite && "text-red-500 hover:text-red-600",
				className
			)}
			aria-label={
				isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
			}
		>
			<Heart
				className={cn(
					iconSizes[size],
					isFavorite ? "fill-current" : "fill-none"
				)}
			/>
		</Button>
	);
}
