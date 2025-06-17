import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import Link from "next/link";

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
					particuliers pour annonces d’achat et revente.
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
			</main>
			<Footer />
		</>
	);
}
