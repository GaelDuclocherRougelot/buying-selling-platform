import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import CookieBanner from "@/components/ui/cookie-banner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// font-family "Geist" initialized
const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

// font-family "Geist Mono" initialized
const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

// Metadata for the root layout
export const metadata: Metadata = {
	title: {
		default: "ZONE - Trouvez et Vendez Facilement",
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

/**
 * Root layout component for the application.
 *
 * @returns {JSX.Element} The root layout component.
 */
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="fr">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ErrorBoundary>
					<Toaster />
					{children}
					<CookieBanner />
				</ErrorBoundary>
			</body>
		</html>
	);
}
