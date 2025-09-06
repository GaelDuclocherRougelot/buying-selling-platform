import type { Metadata } from "next";
import LoginForm from "./_components/SignIn";

export const metadata: Metadata = {
	title: "Connexion",
	description:
		"Connectez-vous à votre compte pour accéder à votre espace personnel. Gérez vos achats, ventes et paramètres de compte en toute sécurité.",
	keywords: [
		"connexion",
		"login",
		"authentification",
		"compte",
		"se connecter",
	],
	openGraph: {
		title: "Connexion - Plateforme d'Achat et de Vente",
		description:
			"Connectez-vous à votre compte pour accéder à votre espace personnel.",
		url: "/auth/login",
	},
	twitter: {
		title: "Connexion - Plateforme d'Achat et de Vente",
		description:
			"Connectez-vous à votre compte pour accéder à votre espace personnel.",
	},
};

/**
 * Renders the login page for the application.
 *
 * This component displays a centered layout containing the `LoginForm` component,
 * which handles user authentication.
 *
 * @returns The login page layout with the sign-in form.
 */
export default function Login() {
	return (
		<main className="flex flex-col items-center justify-center min-h-screen p-4 lg:p-0">
			<LoginForm />
		</main>
	);
}
