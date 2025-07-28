import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
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
	openGraph: {
		title: "Politique de Confidentialité - Plateforme d'Achat et de Vente",
		description:
			"Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée.",
		url: "/legal/politique-de-confidentialite",
	},
	twitter: {
		title: "Politique de Confidentialité - Plateforme d'Achat et de Vente",
		description:
			"Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée.",
	},
};

const PolitiqueDeConfidentialite = () => (
	<>
		<Header />
		<main className="prose max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full flex flex-col gap-6 ">
			<h1>Politique de Confidentialité</h1>

			<h2>1. Identité du responsable du traitement</h2>
			<p>
				Le présent site est édité par :<br />
				<strong>Nom :</strong> Gaël Duclocher-Rougelot
				<br />
				<strong>Adresse mail :</strong> gaelduclocher.rougelot@gmail.com
				<br />
				<strong>Finalité du site :</strong> Mise en relation entre
				particuliers pour annonces d&apos;achat et revente.
			</p>

			<h2>2. Données personnelles collectées</h2>
			<p>
				Nous collectons uniquement les données strictement nécessaires
				au bon fonctionnement du site :
			</p>
			<ul className="list-disc pl-6">
				<li>
					Données d’identification : nom, prénom, pseudo, adresse
					email, mot de passe crypté
				</li>
				<li>Contenu des annonces ou messages envoyés</li>
				<li>
					Données de connexion (adresse IP, navigateur, date/heure)
				</li>
				<li>
					Données de navigation (avec votre consentement pour les
					cookies)
				</li>
			</ul>

			<h2>3. Finalité du traitement</h2>
			<p>Les données collectées sont utilisées pour :</p>
			<ul className="list-disc pl-6">
				<li>
					Permettre la création et la gestion des comptes utilisateur
				</li>
				<li>Publier et gérer les annonces</li>
				<li>
					Assurer la sécurité du site et lutter contre les fraudes
				</li>
				<li>Répondre aux demandes des utilisateurs (FAQ et robot)</li>
				<li>
					Améliorer le site (analyse anonyme de fréquentation si
					accepté, Google Analytics)
				</li>
			</ul>

			<h2>4. Base légale du traitement</h2>
			<p>Les traitements réalisés reposent sur :</p>
			<ul className="list-disc pl-6">
				<li>Votre consentement</li>
				<li>
					L’exécution du service que vous avez demandé (compte,
					annonces)
				</li>
				<li>
					Notre intérêt légitime et légal à assurer la sécurité du
					site
				</li>
			</ul>

			<h2>5. Durée de conservation</h2>
			<p>Vos données sont conservées :</p>
			<ul className="list-disc pl-6">
				<li>Tant que le compte est actif</li>
				<li>
					Jusqu’à 12 mois après la suppression du compte (sauf
					obligations légales contraires)
				</li>
				<li>
					Les cookies sont conservés entre 6 et 13 mois selon leur
					nature
				</li>
			</ul>

			<h2>6. Destinataires des données</h2>
			<p>
				Vos données sont traitées uniquement par nous et, si nécessaire,
				par :
			</p>
			<ul className="list-disc pl-6">
				<li>Notre hébergeur (Vercel)</li>
				<li>Notre hébergeur de données (Neon.tech)</li>
				<li>
					Nos prestataires techniques (sécurité, gestion des e-mails)
				</li>
			</ul>
			<p>Aucune donnée n’est vendue à des tiers.</p>

			<h2>7. Vos droits</h2>
			<p>Conformément au RGPD, vous disposez des droits suivants :</p>
			<ul className="list-disc pl-6">
				<li>Droit d’accès à vos données</li>
				<li>Droit à rectification</li>
				<li>Droit à l’effacement (droit à l’oubli)</li>
				<li>Droit d’opposition et de limitation</li>
				<li>Droit à la portabilité</li>
			</ul>
			<p>
				Vous pouvez exercer vos droits en nous contactant à l’adresse
				suivante :{" "}
				<a href="mailto:gaelduclocher.rougelot@gmail.com">
					gaelduclocher.rougelot@gmail.com
				</a>
				<br />
				Une réponse vous sera apportée sous 30 jours.
			</p>

			<h2>8. Sécurité</h2>
			<p>
				Nous mettons en œuvre des mesures de sécurité techniques et
				organisationnelles pour protéger vos données :
			</p>
			<ul className="list-disc pl-6">
				<li>Connexion sécurisée (HTTPS / Certificat SSL)</li>
				<li>Mots de passe cryptés</li>
				<li>Accès administrateur protégé</li>
			</ul>

			<h2>9. Cookies</h2>
			<p>Des cookies peuvent être déposés sur votre appareil :</p>
			<ul className="list-disc pl-6">
				<li>Cookies essentiels (fonctionnement du site)</li>
				<li>Cookies de mesure d’audience (avec votre accord)</li>
				<li>Cookies tiers (non utilisés sans votre consentement)</li>
			</ul>
			<p>
				Vous pouvez à tout moment modifier vos préférences via le
				bandeau cookies en bas de page.
			</p>

			<h2>10. Modifications</h2>
			<p>
				Cette politique peut être mise à jour. La date de dernière mise
				à jour est : 17/06/2025.
			</p>
		</main>
		<Footer />
	</>
);

export default PolitiqueDeConfidentialite;
