"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";

function ForgetPasswordInner() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const router = useRouter();

	if (!token) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-0">
				<div className="w-full max-w-md p-6 space-y-4 text-center border rounded-md bg-white">
					<h1 className="text-3xl font-bold">
						Réinitialiser mon mot de passe
					</h1>
					<p className="text-sm text-gray-600">
						Veuillez saisir votre adresse e-mail pour recevoir un
						lien de réinitialisation de mot de passe.
					</p>
					<form
						className="flex flex-col gap-4"
						action={async (formData) => {
							const email = formData.get("email");
							await authClient.forgetPassword(
								{
									email: String(email),
									redirectTo: "/auth/reset-password",
								},
								{
									onSuccess: () => {
										toast.success(
											"Un lien de réinitialisation a été envoyé à votre adresse e-mail."
										);
										router.push(
											`/auth/verify?email=${email}`
										);
									},
								}
							);
						}}
					>
						<Input type="email" name="email" placeholder="Email" />
						<SubmitButton
							type="submit"
							className="w-full rounded-md py-5"
						>
							Recevoir le lien de réinitialisation
						</SubmitButton>
					</form>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-0">
			<div className="w-full max-w-md p-6 space-y-4 text-center">
				<h1 className="text-3xl font-bold">
					Réinitialiser mon mot de passe
				</h1>
				<p className="text-sm text-gray-600">
					Veuillez saisir votre adresse e-mail pour recevoir un lien
					de réinitialisation de mot de passe.
				</p>
				<form
					action={async (formData) => {
						const email = formData.get("email");
						await authClient.resetPassword(
							{
								newPassword: email as string,
								token: token as string,
							},
							{
								onSuccess: () => {
									router.push("/auth/login");
								},
								onError: (ctx) => {
									toast.error(
										ctx.error.message ||
											"Une erreur est survenue lors de la réinitialisation du mot de passe."
									);
								},
							}
						);
					}}
					className="space-y-4"
				>
					<Input
						type="password"
						name="password"
						placeholder="Nouveau mot de passe"
					/>
					<Button
						type="submit"
						variant="default"
						className="w-full rounded-md py-5"
					>
						Recevoir le lien de réinitialisation
					</Button>
				</form>
			</div>
		</div>
	);
}

export default function ForgetPassword() {
	return (
		<Suspense>
			<ForgetPasswordInner />
		</Suspense>
	);
}
