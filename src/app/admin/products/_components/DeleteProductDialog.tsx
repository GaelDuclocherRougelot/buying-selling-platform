import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Product } from "./types";

interface DeleteProductDialogProps {
	productToDelete: Product | null;
	onClose: () => void;
	onDelete: (product: Product) => void;
}

export function DeleteProductDialog({
	productToDelete,
	onClose,
	onDelete,
}: DeleteProductDialogProps) {
	return (
		<AlertDialog
			open={!!productToDelete}
			onOpenChange={(open) => !open && onClose()}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Êtes-vous sûr de vouloir supprimer ce produit ?
					</AlertDialogTitle>
					<AlertDialogDescription>
						Cette action ne pourra plus être annulée.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Annuler</AlertDialogCancel>
					<AlertDialogAction
						onClick={() =>
							productToDelete && onDelete(productToDelete)
						}
						className="bg-red-600 hover:bg-red-700"
					>
						Supprimer
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
