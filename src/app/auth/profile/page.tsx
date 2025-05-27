import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/lib/auth-session";
import LogOutButton from "./_components/LogOutButton";
import Header from "@/components/global/Header";

const ProfilePage = async () => {
	const user = await getUser();

	if (!user) {
		return <div>Vous n&apos;êtes pas connecté</div>;
	}

	return (
		<>
		<Header />
		<main className="flex justify-center items-center h-[calc(100vh-80px)]">
			<Card className="w-96">
				<CardHeader>
					<div className="flex items-center space-x-4">
						<Avatar>
							<AvatarImage
								src={
									user?.image ||
									"https://via.placeholder.com/150"
								}
								alt="User Avatar"
							/>
							<AvatarFallback>
								{user?.name
									? user.name
											.split(" ")
											.map((n) => n[0])
											.join("")
									: "NA"}
							</AvatarFallback>
						</Avatar>
						<div>
							<CardTitle>{user?.name || "Guest User"}</CardTitle>
							<p className="text-sm text-muted-foreground">
								{user?.email || "No email available"}
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-sm">
						Bienvenue sur votre profil ! Vous pouvez modifier vos
						informations ici.
					</p>
				</CardContent>
				<CardFooter className="flex justify-end gap-4">
					<Button variant="default">Modifier mes informations</Button>
					<LogOutButton />
				</CardFooter>
			</Card>
		</main>
		</>
	);
};

export default ProfilePage;
