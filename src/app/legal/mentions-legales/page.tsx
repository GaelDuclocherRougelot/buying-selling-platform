import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
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
	openGraph: {
		title: "Mentions Légales - Plateforme d'Achat et de Vente",
		description:
			"Consultez les mentions légales de notre plateforme d&apos;achat et de vente.",
		url: "/legal/mentions-legales",
	},
	twitter: {
		title: "Mentions Légales - Plateforme d'Achat et de Vente",
		description:
			"Consultez les mentions légales de notre plateforme d&apos;achat et de vente.",
	},
};

export default function MentionsLegalesPage() {
	return (
		<>
			<Header />
			<main className="prose max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full h-screen flex flex-col gap-6 ">
				<h1>Mentions légales</h1>

				<h2>1. Identité du responsable du traitement</h2>
				<p>
					Le présent site est édité par :<br />
					<strong>Nom :</strong> Gaël Duclocher-Rougelot
					<br />
					<strong>Adresse mail :</strong>{" "}
					gaelduclocher.rougelot@gmail.com
					<br />
					<strong>Finalité du site :</strong> Mise en relation entre
					particuliers pour annonces d&apos;achat et revente.
				</p>
				<h2>2. Hébergeur du site</h2>
				<p>
					{" "}
					Hébergé par{" "}
					<Link
						href="https://vercel.com"
						target="blank"
						className="underline"
					>
						Vercel
					</Link>
				</p>
				<h2>3. Hébergeur de données</h2>
				<p>
					Hébergé par{" "}
					<Link
						href="https://neon.tech"
						target="blank"
						className="underline"
					>
						Neon.tech
					</Link>
				</p>
				<h2>4. Système de paiement</h2>
				<p>
					Le système de paiement est géré par{" "}
					<Link href="https://stripe.com" target="blank" className="underline">
						Stripe
					</Link>
				</p>
			</main>
			<Footer />
		</>
	);
}
