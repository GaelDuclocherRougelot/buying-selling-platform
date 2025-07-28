import type { Metadata } from "next";

export const forgetPasswordMetadata: Metadata = {
	title: "Mot de Passe Oublié",
	description:
		"Réinitialisez votre mot de passe en toute sécurité. Entrez votre adresse e-mail pour recevoir un lien de réinitialisation et retrouver l&apos;accès à votre compte.",
	keywords: [
		"mot de passe oublié",
		"réinitialisation",
		"sécurité",
		"compte",
		"connexion",
	],
	openGraph: {
		title: "Mot de Passe Oublié - Plateforme d'Achat et de Vente",
		description:
			"Réinitialisez votre mot de passe en toute sécurité. Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.",
		url: "/auth/forget-password",
	},
	twitter: {
		title: "Mot de Passe Oublié - Plateforme d'Achat et de Vente",
		description:
			"Réinitialisez votre mot de passe en toute sécurité. Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.",
	},
};
