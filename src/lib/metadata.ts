import type { Metadata } from "next";

// Base metadata configuration
export const baseMetadata: Metadata = {
	title: {
		default:
			"Plateforme d'Achat et de Vente - Trouvez et Vendez Facilement",
		template: "%s | Plateforme d'Achat et de Vente",
	},
	description:
		"Plateforme sécurisée pour acheter et vendre des produits en ligne. Trouvez des articles uniques, vendez vos objets et connectez-vous avec d'autres acheteurs et vendeurs.",
	keywords: [
		"achat",
		"vente",
		"plateforme",
		"e-commerce",
		"produits",
		"marketplace",
		"achat en ligne",
		"vente en ligne",
	],
	authors: [{ name: "Plateforme d'Achat et de Vente" }],
	creator: "Plateforme d'Achat et de Vente",
	publisher: "Plateforme d'Achat et de Vente",
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
	),
	alternates: {
		canonical: "/",
	},
	openGraph: {
		type: "website",
		locale: "fr_FR",
		url: "/",
		title: "Plateforme d'Achat et de Vente - Trouvez et Vendez Facilement",
		description:
			"Plateforme sécurisée pour acheter et vendre des produits en ligne. Trouvez des articles uniques, vendez vos objets et connectez-vous avec d'autres acheteurs et vendeurs.",
		siteName: "Plateforme d'Achat et de Vente",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "Plateforme d'Achat et de Vente",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Plateforme d'Achat et de Vente - Trouvez et Vendez Facilement",
		description:
			"Plateforme sécurisée pour acheter et vendre des produits en ligne.",
		images: ["/og-image.jpg"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	verification: {
		google: "google-site-verification-code",
	},
};

// Page-specific metadata configurations
export const pageMetadata = {
	home: {
		title: "Accueil",
		description:
			"Découvrez notre plateforme d&apos;achat et de vente. Parcourez les produits mis en avant et explorez les catégories populaires pour trouver ce que vous cherchez ou vendre vos objets.",
		keywords: [
			"accueil",
			"produits",
			"catégories",
			"achat",
			"vente",
			"marketplace",
		],
		url: "/",
	},
	login: {
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
		url: "/auth/login",
	},
	register: {
		title: "Inscription",
		description:
			"Créez votre compte gratuitement et rejoignez notre communauté d&apos;acheteurs et vendeurs. Commencez à acheter et vendre en toute sécurité dès aujourd&apos;hui.",
		keywords: [
			"inscription",
			"créer compte",
			"s&apos;inscrire",
			"nouveau compte",
			"inscription gratuite",
		],
		url: "/auth/register",
	},
	profile: {
		title: "Profil",
		description:
			"Gérez votre profil utilisateur, vos informations personnelles, vos produits en vente et vos paramètres de compte. Accédez à votre tableau de bord personnel.",
		keywords: [
			"profil",
			"compte",
			"paramètres",
			"utilisateur",
			"tableau de bord",
			"mes produits",
		],
		url: "/auth/profile",
	},
	publish: {
		title: "Publier un Produit",
		description:
			"Publiez votre produit sur notre plateforme d&apos;achat et de vente. Créez une annonce attractive avec photos, description détaillée et prix pour maximiser vos chances de vente.",
		keywords: [
			"publier",
			"produit",
			"annonce",
			"vente",
			"créer annonce",
			"mettre en vente",
		],
		url: "/auth/publish",
	},
	forgetPassword: {
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
		url: "/auth/forget-password",
	},
	cgu: {
		title: "Conditions Générales d&apos;Utilisation",
		description:
			"Consultez nos conditions générales d&apos;utilisation pour comprendre les règles et obligations lors de l&apos;utilisation de notre plateforme d&apos;achat et de vente.",
		keywords: [
			"CGU",
			"conditions générales",
			"utilisation",
			"règles",
			"obligations",
			"plateforme",
		],
		url: "/legal/cgu",
	},
	cgv: {
		title: "Conditions Générales de Vente",
		description:
			"Consultez nos conditions générales de vente pour comprendre les règles de commande, livraison, prix et droit de rétractation sur notre plateforme d&apos;achat et de vente.",
		keywords: [
			"CGV",
			"conditions générales de vente",
			"commande",
			"livraison",
			"prix",
			"rétractation",
		],
		url: "/legal/cgv",
	},
	privacy: {
		title: "Politique de Confidentialité",
		description:
			"Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée sur notre plateforme d&apos;achat et de vente. Consultez notre politique de confidentialité complète.",
		keywords: [
			"confidentialité",
			"données personnelles",
			"RGPD",
			"protection",
			"vie privée",
			"politique",
		],
		url: "/legal/politique-de-confidentialite",
	},
	legalNotices: {
		title: "Mentions Légales",
		description:
			"Consultez les mentions légales de notre plateforme d&apos;achat et de vente. Informations sur l&apos;éditeur, l&apos;hébergeur et les données personnelles.",
		keywords: [
			"mentions légales",
			"éditeur",
			"hébergeur",
			"responsable",
			"informations légales",
		],
		url: "/legal/mentions-legales",
	},
};

// Helper function to generate metadata for a specific page
export function generatePageMetadata(
	pageKey: keyof typeof pageMetadata
): Metadata {
	const page = pageMetadata[pageKey];

	return {
		title: page.title,
		description: page.description,
		keywords: page.keywords,
		openGraph: {
			title: `${page.title} - Plateforme d'Achat et de Vente`,
			description: page.description,
			url: page.url,
		},
		twitter: {
			title: `${page.title} - Plateforme d'Achat et de Vente`,
			description: page.description,
		},
	};
}
