import Header from "@/components/global/Header";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { getUser } from "@/lib/auth-session";
import { AlertDialogDelete } from "./_components/AlertDialogDelete";

const ProfileEditPage = async () => {
	const user = await getUser();

	if (!user) {
		return <div>Vous n&apos;êtes pas connecté</div>;
	}

	return (
		<>
			<Header />
			<main className="flex justify-center px-4 lg:px-10 py-8">
				<Card className="flex flex-col gap-10 w-full max-w-[1300px] h-fit">
					<CardHeader className="flex justify-between items-center border-b pb-4">
						<h1>Paramètres du compte</h1>
					</CardHeader>
					<CardContent>
						<h2>Mon profil</h2>

						<h2>Mes informations personnelles</h2>
					</CardContent>
					<CardFooter className="flex justify-end gap-4">
						<AlertDialogDelete />
					</CardFooter>
				</Card>
			</main>
		</>
	);
};

export default ProfileEditPage;
