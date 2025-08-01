import Header from "@/components/global/Header";
import DataRightsManager from "@/components/rgpd/DataRightsManager";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import VerifiedUser from "@/components/ui/verified-user";
import { auth } from "@/lib/auth";
import { getUser } from "@/lib/auth-session";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertDialogDelete } from "./_components/AlertDialogDelete";
import ProfileForm from "./_components/ProfileForm";

/**
 * Profile Edit Page
 *
 * This page displays the user's profile information.
 * Allows the user to edit their profile and delete their account.
 * @protected
 * @requiresAuthentication
 */
const ProfileEditPage = async () => {
	const user = await getUser();

	if (!user) {
		redirect("/auth/login");
		return null; // Prevents further rendering if user is not authenticated
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
						<div className="flex flex-col gap-4 mb-6">
							<h2>Mon profil</h2>
							<ProfileForm user={user} />
						</div>

						<h2 className="mb-4">Mes informations personnelles</h2>

						<div className="flex gap-4 items-center">
							<label>Email</label>
							<p>{user.email}</p>
							{user.emailVerified ? (
								<VerifiedUser />
							) : (
								<form>
									<SubmitButton
										formAction={async () => {
											"use server";
											await auth.api.sendVerificationEmail(
												{
													headers: await headers(),
													body: {
														email: user.email,
														callbackURL: `/auth/login`,
													},
												}
											);
											redirect(
												`/auth/verify?email=${user.email}`
											);
										}}
									>
										Vérifier mon email
									</SubmitButton>
								</form>
							)}
						</div>
						<div className="flex flex-col gap-2 mt-4">
							<label>Mot de passe </label>
							<Button className="w-fit">
								<Link href="/auth/forget-password">
									Réinitialiser mon mot de passe
								</Link>
							</Button>
						</div>

						<div className="mt-8">
							<h2 className="py-8">Mes droits RGPD</h2>
							<DataRightsManager />
						</div>
					</CardContent>
					<CardFooter className="flex justify-end gap-4">
						<AlertDialogDelete userId={user.id} />
					</CardFooter>
				</Card>
			</main>
		</>
	);
};

export default ProfileEditPage;
