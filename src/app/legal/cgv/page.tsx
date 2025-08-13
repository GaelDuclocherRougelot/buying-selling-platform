import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
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
	openGraph: {
		title: "Conditions Générales de Vente - Plateforme d'Achat et de Vente",
		description:
			"Consultez nos conditions générales de vente pour comprendre les règles de commande et livraison.",
		url: "/legal/cgv",
	},
	twitter: {
		title: "Conditions Générales de Vente - Plateforme d'Achat et de Vente",
		description:
			"Consultez nos conditions générales de vente pour comprendre les règles de commande et livraison.",
	},
};

const CGVPage = () => (
	<>
		<Header />
		<main className="prose h-screen max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full flex flex-col gap-6">
			<h1>Conditions Générales de Vente</h1>
			<section>
				<h2>1. Objet</h2>
				<p>
					Les présentes Conditions Générales de Vente (CGV) régissent
					les ventes réalisées sur notre plateforme. En passant
					commande, vous acceptez sans réserve les présentes CGV.
				</p>
			</section>
			<section>
				<h2>2. Commandes</h2>
				<p>
					Toute commande passée sur le site implique
					l&apos;acceptation intégrale des présentes conditions. Les
					informations contractuelles seront confirmées par email
					après validation de la commande.
				</p>
			</section>
			<section>
				<h2>3. Prix</h2>
				<p>
					Les prix sont indiqués en euros, toutes taxes comprises.
					Nous nous réservons le droit de modifier les prix à tout
					moment, mais les produits seront facturés sur la base des
					tarifs en vigueur au moment de la validation de la commande.
				</p>
			</section>
			<section>
				<h2>4. Livraison</h2>
				<p>
					Les produits sont livrés à l&apos;adresse indiquée lors de
					la commande. Les délais de livraison sont donnés à titre
					indicatif.
				</p>
			</section>
			<section>
				<h2>5. Droit de rétractation</h2>
				<p>
					Conformément à la législation en vigueur, vous disposez
					d&apos;un délai de 14 jours pour exercer votre droit de
					rétractation sans avoir à justifier de motifs.
				</p>
			</section>
			<section>
				<h2>6. Responsabilité</h2>
				<p>
					La responsabilité de la plateforme ne saurait être engagée
					en cas de dommages résultant d&apos;une mauvaise utilisation
					du produit acheté.
				</p>
			</section>
			<section>
				<h2>7. Loi applicable</h2>
				<p>
					Les présentes CGV sont soumises à la loi française. En cas
					de litige, les tribunaux français seront seuls compétents.
				</p>
			</section>
		</main>
		<Footer />
	</>
);

export default CGVPage;
