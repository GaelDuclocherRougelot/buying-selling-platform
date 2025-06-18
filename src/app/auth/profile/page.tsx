import Header from "@/components/global/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth-session";
import Link from "next/link";
import { ProductsTable } from "../../../features/product/ProductsTable";
import LogOutButton from "./_components/LogOutButton";

/**
 * Profile Page
 *
 * This page displays the user's profile information.
 * @protected
 * @requiresAuthentication
 */
const ProfilePage = async () => {
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
						<div className="flex items-center space-x-4">
							<Avatar className="h-16 w-16">
								<AvatarImage
									src={
										user?.image ||
										"https://via.placeholder.com/150"
									}
									className="object-cover"
									alt="User Avatar"
								/>
								<AvatarFallback className="font-bold">
									{user?.name
										? user.name
												.split(" ")
												.map((n) => n[0])
												.join("")
										: "NA"}
								</AvatarFallback>
							</Avatar>
							<div className="text-lg font-semibold">
								<CardTitle>
									{user.username || user?.name.split(" ")[0]}
								</CardTitle>
							</div>
						</div>
						<div className="space-x-2">
							<Link href="/auth/profile/edit">
								<Button variant="default">
									Paramètres du compte
								</Button>
							</Link>
							<LogOutButton />
						</div>
					</CardHeader>
					<CardContent>
						<h2>Mes annonces</h2>
						<ProductsTable />
					</CardContent>
					{/* <CardFooter className="flex justify-end gap-4"></CardFooter> */}
				</Card>
			</main>
		</>
	);
};

export default ProfilePage;
