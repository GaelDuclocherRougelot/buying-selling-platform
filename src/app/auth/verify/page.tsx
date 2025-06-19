"use client"
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function VerifyPage() {
	const searchParams = useSearchParams();
	const email = searchParams.get("email");

	return (
		<Card>
			<CardHeader>
				<CardTitle>Important : Vérifiez votre adresse e-mail</CardTitle>
				{email ? (
					<CardDescription>
						Nous avons envoyé un lien de vérification à {email}.
					</CardDescription>
				) : null}
			</CardHeader>
		</Card>
	);
}
