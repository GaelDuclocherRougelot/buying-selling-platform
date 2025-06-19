import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function ResetPasswordPage() {
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
		<Card>
			<CardHeader>
				<CardTitle>Réinitialiser le mot de passe</CardTitle>
				<CardDescription>
					Réinitialisez votre mot de passe en entrant votre nouveau
					mot de passe ci-dessous.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form action={onSubmit} className="flex flex-col gap-4">
					<div className="space-y-2">
						<Label htmlFor="password">Nouveau mot de passe</Label>
						<Input type="password" id="password" name="password" />
					</div>
					<SubmitButton>Réinitialiser le mot de passe</SubmitButton>
				</form>
			</CardContent>
		</Card>
	);
}
