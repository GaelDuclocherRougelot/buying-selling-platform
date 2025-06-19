import Header from "@/components/global/Header";
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
						<div className="flex flex-col gap-4 mb-6">
							<h2>Mon profil</h2>
							<ProfileForm user={user} />
						</div>

						<h2 className="mb-4">Mes informations personnelles</h2>

						<div className="flex gap-4 items-center">
							<p>Email: {user.email}</p>
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
