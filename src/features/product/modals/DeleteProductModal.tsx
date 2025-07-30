"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { Product } from "../types";

interface DeleteProductModalProps {
	product: Product | null;
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (product: Product) => void;
}

export function DeleteProductModal({
	product,
	isOpen,
	onClose,
	onConfirm,
}: DeleteProductModalProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirm = async () => {
		if (!product) return;

		setIsDeleting(true);
		try {
			const response = await apiFetch(`/api/products/${product.id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				// Call the parent's onConfirm callback to update the UI
				onConfirm(product);
				console.log("Produit supprimé avec succès");
			} else {
				const errorData = await response.json();
				console.error("Erreur lors de la suppression:", errorData);
				// You could add a toast notification here
			}
		} catch (error) {
			console.error("Erreur lors de la suppression du produit:", error);
			// You could add a toast notification here
		} finally {
			setIsDeleting(false);
			onClose();
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
					<AlertDialogDescription>
						Cette action ne peut pas être annulée. Cela supprimera
						définitivement l&apos;annonce &quot;{product?.title}
						&quot;.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>
						Annuler
					</AlertDialogCancel>
					<Button
						onClick={handleConfirm}
						variant="destructive"
						disabled={isDeleting}
					>
						{isDeleting ? "Suppression..." : "Supprimer"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
