import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function AlertDialogDelete() {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" className="font-bold cursor-pointer">Supprimer mon compte</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Êtes vous sûr de vouloir supprimer votre compte ?
					</AlertDialogTitle>
					<AlertDialogDescription>
                        Cette action est irréversible.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="cursor-pointer">Annuler</AlertDialogCancel>
					<AlertDialogAction className="bg-destructive hover:bg-destructive hover:opacity-80 text-white font-bold">Supprimer mon compte</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
