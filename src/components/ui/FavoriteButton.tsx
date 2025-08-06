"use client";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface FavoriteButtonProps {
	productId: string;
	className?: string;
	size?: "sm" | "lg" | "default" | "icon";
	variant?: "default" | "outline" | "ghost";
}

export default function FavoriteButton({
	productId,
	className,
	size = "default",
	variant = "ghost",
}: FavoriteButtonProps) {
	const { data: session } = useSession();
	const [isFavorite, setIsFavorite] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const checkFavoriteStatus = useCallback(async () => {
		try {
			const response = await apiFetch("/api/favorites");
			if (response.ok) {
				const favorites = await response.json();
				const isInFavorites = favorites.some(
					(fav: { product: { id: string } }) =>
						fav.product.id === productId
				);
				setIsFavorite(isInFavorites);
			}
		} catch (error) {
			console.error("Error checking favorite status:", error);
		}
	}, [productId]);

	// Check if product is in favorites on mount
	useEffect(() => {
		if (session?.user?.id) {
			checkFavoriteStatus();
		}
	}, [session?.user?.id, productId, checkFavoriteStatus]);

	const toggleFavorite = async () => {
		if (!session?.user?.id) {
			toast.error("Veuillez vous connecter pour ajouter des favoris");
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
					toast.error("Erreur lors de la suppression du favori");
				}
			} else {
				// Add to favorites
				const response = await apiFetch("/api/favorites", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ productId }),
				});

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
						toast.error("Erreur lors de l'ajout aux favoris");
					}
				}
			}
		} catch (error) {
			console.error("Error toggling favorite:", error);
			toast.error("Erreur lors de la gestion des favoris");
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
					"transition-all duration-200",
					isFavorite && "fill-current"
				)}
			/>
		</Button>
	);
}
