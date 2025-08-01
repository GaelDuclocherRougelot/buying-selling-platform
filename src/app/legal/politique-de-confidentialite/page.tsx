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
					Données d&apos;identification : nom, prénom, pseudo, adresse
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
				<li>
					Données de paiement (via Stripe, conformément à leur
					politique de confidentialité)
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
				<li>
					Traiter les paiements et gérer les transactions (via Stripe)
				</li>
			</ul>

			<h2>4. Base légale du traitement</h2>
			<p>Les traitements réalisés reposent sur :</p>
			<ul className="list-disc pl-6">
				<li>Votre consentement (pour les cookies non essentiels)</li>
				<li>
					L&apos;exécution du service que vous avez demandé (compte,
					annonces, paiements)
				</li>
				<li>
					Notre intérêt légitime et légal à assurer la sécurité du
					site
				</li>
				<li>
					L&apos;obligation légale de conserver certaines données pour
					des raisons fiscales
				</li>
			</ul>

			<h2>5. Durée de conservation</h2>
			<p>Vos données sont conservées :</p>
			<ul className="list-disc pl-6">
				<li>Tant que le compte est actif</li>
				<li>
					Jusqu&apos;à 12 mois après la suppression du compte (sauf
					obligations légales contraires)
				</li>
				<li>
					Les cookies sont conservés entre 6 et 13 mois selon leur
					nature
				</li>
				<li>
					Les données de paiement sont conservées 5 ans (obligation
					fiscale)
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
				<li>
					Stripe (pour le traitement des paiements) - voir leur
					politique de confidentialité
				</li>
			</ul>
			<p>Aucune donnée n&apos;est vendue à des tiers.</p>

			<h2>7. Vos droits</h2>
			<p>Conformément au RGPD, vous disposez des droits suivants :</p>
			<ul className="list-disc pl-6">
				<li>
					<strong>Droit d&apos;accès :</strong> Vous pouvez
					télécharger toutes vos données depuis votre profil
				</li>
				<li>
					<strong>Droit à rectification :</strong> Modifiez vos
					informations dans votre profil
				</li>
				<li>
					<strong>Droit à l&apos;effacement :</strong> Supprimez votre
					compte définitivement
				</li>
				<li>
					<strong>Droit d&apos;opposition et de limitation :</strong>{" "}
					Contactez-nous
				</li>
				<li>
					<strong>Droit à la portabilité :</strong> Exportez vos
					données au format JSON
				</li>
			</ul>
			<p>
				Vous pouvez exercer vos droits en nous contactant à
				l&apos;adresse suivante :{" "}
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
				<li>Chiffrement des données sensibles</li>
				<li>Sauvegardes sécurisées</li>
			</ul>

			<h2>9. Cookies</h2>
			<p>Des cookies peuvent être déposés sur votre appareil :</p>
			<ul className="list-disc pl-6">
				<li>
					<strong>Cookies essentiels :</strong> Indispensables au
					fonctionnement du site (session, authentification)
				</li>
				<li>
					<strong>Cookies d&apos;analyse :</strong> Nous aident à
					comprendre comment vous utilisez le site (avec votre accord)
				</li>
				<li>
					<strong>Cookies marketing :</strong> Utilisés pour vous
					proposer des contenus personnalisés (avec votre
					consentement)
				</li>
			</ul>
			<p>
				Vous pouvez à tout moment modifier vos préférences via le
				bandeau cookies en bas de page ou dans les paramètres de votre
				navigateur.
			</p>

			<h2>10. Transferts de données</h2>
			<p>
				Vos données sont stockées dans l&apos;Union Européenne. En cas
				de transfert hors UE, nous nous assurons que le niveau de
				protection est adéquat (notamment pour les services Stripe qui
				respectent le Privacy Shield).
			</p>

			<h2>11. Droit de plainte</h2>
			<p>
				Si vous estimez que vos droits ne sont pas respectés, vous
				pouvez déposer une plainte auprès de la CNIL :{" "}
				<a
					href="https://www.cnil.fr/fr/plaintes"
					target="_blank"
					rel="noopener noreferrer"
				>
					https://www.cnil.fr/fr/plaintes
				</a>
			</p>

			<h2>12. Modifications</h2>
			<p>
				Cette politique peut être mise à jour. La date de dernière mise
				à jour est : 17/06/2025.
			</p>
		</main>
		<Footer />
	</>
);

export default PolitiqueDeConfidentialite;
