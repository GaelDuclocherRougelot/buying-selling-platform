import type { Metadata } from "next";
import SignUp from "./_components/SignUp";

export const metadata: Metadata = {
	title: "Inscription",
	description:
		"Créez votre compte gratuitement et rejoignez notre communauté d'acheteurs et vendeurs. Commencez à acheter et vendre en toute sécurité dès aujourd'hui.",
	keywords: [
		"inscription",
		"créer compte",
		"s'inscrire",
		"nouveau compte",
		"inscription gratuite",
	],
	openGraph: {
		title: "Inscription - Plateforme d'Achat et de Vente",
		description:
			"Créez votre compte gratuitement et rejoignez notre communauté d'acheteurs et vendeurs.",
		url: "/auth/register",
	},
	twitter: {
		title: "Inscription - Plateforme d'Achat et de Vente",
		description:
			"Créez votre compte gratuitement et rejoignez notre communauté d'acheteurs et vendeurs.",
	},
};

/**
 * SignUp page component.
 * This component renders the SignUp form within a main section.
 *
 * @returns {JSX.Element} The SignUp page component
 */
export default function page(): JSX.Element {
	return (
		<main className="flex flex-col items-center justify-center min-h-screen p-4 lg:p-0">
			<SignUp />
		</main>
	);
}
