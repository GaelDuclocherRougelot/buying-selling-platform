"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";

/**
 * This component handles the reset password functionality.
 * It allows users to reset their password using a token provided in the URL.
 * It includes a form for entering the new password and handles the submission.
 * If the token is invalid or the password reset fails, it displays an error message.
 * On successful password reset, it redirects the user to the login page.
 */
function ResetPasswordInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	async function onSubmit(formData: FormData) {
		const password = formData.get("password");

		if (!token) {
			toast.error("token invalide");
			return;
		}

		await authClient.resetPassword(
			{
				newPassword: password as string,
				token: token as string,
			},
			{
				onSuccess: () => {
					toast.success("Mot de passe réinitialisé avec succès");
					router.push("/auth/login");
				},
				onError: (error) => {
					toast.error(error.error.message);
				},
			}
		);
	}

	return (
		<main className="flex flex-col items-center justify-center min-h-screen p-0">
			<div className="w-full max-w-md p-6 space-y-4 text-center border rounded-md bg-white">
				<h1 className="text-3xl font-bold">
					Réinitialiser le mot de passe
				</h1>
				<p className="text-sm text-gray-600">
					Réinitialisez votre mot de passe en entrant votre nouveau
					mot de passe ci-dessous.
				</p>

				<form action={onSubmit} className="flex flex-col gap-4">
					<div className="space-y-2">
						<Label htmlFor="password">Nouveau mot de passe</Label>
						<Input type="password" id="password" name="password" />
					</div>
					<SubmitButton>Réinitialiser le mot de passe</SubmitButton>
				</form>
			</div>
		</main>
	);
}

/**
 * ResetPassword component renders the ResetPasswordInner component asynchronously.
 *
 * @returns {JSX.Element} The ResetPassword component
 */
export default function ResetPassword(): JSX.Element {
	return (
		<Suspense>
			<ResetPasswordInner />
		</Suspense>
	);
}