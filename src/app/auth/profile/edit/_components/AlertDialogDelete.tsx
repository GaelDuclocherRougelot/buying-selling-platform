"use client";
import {
	AlertDialog,
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
import { useRouter } from "next/navigation";

export function AlertDialogDelete({ userId }: { userId: string }) {
	const router = useRouter();

	const handleDelete = async () => {
		const res = await apiFetch("/api/auth/soft-delete-user", {
			method: "POST",
			body: JSON.stringify({ userId }),
			headers: { "Content-Type": "application/json" },
		});
		if (res.ok) {
			router.refresh();
		} else {
			console.error("Failed to delete account");
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					variant="destructive"
					className="font-bold cursor-pointer"
				>
					Supprimer mon compte
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Êtes-vous sûr de vouloir supprimer votre compte ?
					</AlertDialogTitle>
					<AlertDialogDescription>
						Cette action est irréversible.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="cursor-pointer">
						Annuler
					</AlertDialogCancel>
					<Button variant="destructive" onClick={handleDelete}>
						Supprimer mon compte
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
