import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Conditions Générales d'Utilisation",
	description:
		"Consultez nos conditions générales d'utilisation pour comprendre les règles et obligations lors de l'utilisation de notre plateforme d'achat et de vente.",
	keywords: [
		"CGU",
		"conditions générales",
		"utilisation",
		"règles",
		"obligations",
		"plateforme",
	],
	openGraph: {
		title: "Conditions Générales d'Utilisation - Plateforme d'Achat et de Vente",
		description:
			"Consultez nos conditions générales d'utilisation pour comprendre les règles et obligations.",
		url: "/legal/cgu",
	},
	twitter: {
		title: "Conditions Générales d'Utilisation - Plateforme d'Achat et de Vente",
		description:
			"Consultez nos conditions générales d'utilisation pour comprendre les règles et obligations.",
	},
};

export default function CGU() {
	return (
		<>
			<Header />
			<main className="prose max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full flex flex-col gap-6 bg-white">
				<h1>Conditions générales d&apos;utilisation</h1>
				<p className="text-sm">
					L&apos;accès et l&apos;utilisation du site et de ses
					services impliquent l&apos;acceptation pleine et entière des
					présentes Conditions Générales d&apos;Utilisation (CGU). Si
					vous n&apos;acceptez pas ces CGU, veuillez ne pas utiliser
					la plateforme.
				</p>
				<section>
					<h2>1. Objet</h2>
					<p>
						La plateforme permet la mise en relation
						d&apos;utilisateurs pour la publication d&apos;annonces,
						l&apos;achat et la vente de produits, la messagerie et
						la gestion de transactions de manière sécurisée via
						Stripe. La plateforme agit en qualité
						d&apos;intermédiaire technique et propose des
						fonctionnalités de protection des paiements et de
						validation des expéditions.
					</p>
				</section>
				<section>
					<h2>2. Éditeur et hébergement</h2>
					<p>
						Les informations légales de l&apos;éditeur et des
						hébergeurs sont disponibles dans les{" "}
						<Link
							href="/legal/mentions-legales"
							className="underline"
						>
							Mentions légales
						</Link>
						.
					</p>
				</section>
				<section>
					<h2>3. Définition</h2>
					<ul className="list-disc pl-6">
						<li>
							<strong>Utilisateur</strong> : toute personne
							disposant d&apos;un compte ou naviguant sur le site.
						</li>
						<li>
							<strong>Vendeur/Acheteur</strong> : utilisateur
							mettant en vente ou achetant un produit.
						</li>
						<li>
							<strong>Annonce</strong> : page présentant un
							produit proposé à la vente.
						</li>
						<li>
							<strong>Transaction</strong> : opération
							d&apos;achat/vente effectuée via Stripe.
						</li>
					</ul>
				</section>
				<section>
					<h2>4. Acceptation des CGU</h2>
					<p>
						Les CGU s&apos;appliquent à tout utilisateur. Elles
						peuvent être mises à jour, notamment pour tenir compte
						des évolutions légales ou fonctionnelles. La version en
						vigueur est disponible sur cette page.
					</p>
				</section>
				<section>
					<h2>5. Accès au service</h2>
					<ul className="list-disc pl-6">
						<li>Accès gratuit à la consultation des annonces.</li>
						<li>
							Certaines fonctionnalités nécessitent un compte :
							publier une annonce, acheter, vendre, envoyer des
							messages, suivre un colis.
						</li>
						<li>
							Vous déclarez être majeur et disposer de la capacité
							juridique pour utiliser les services.
						</li>
					</ul>
				</section>
				<section>
					<h2>6. Compte utilisateur et sécurité</h2>
					<ul className="list-disc pl-6">
						<li>
							Les informations fournies doivent être exactes et à
							jour.
						</li>
						<li>
							Vous êtes responsable de la confidentialité de vos
							identifiants.
						</li>
						<li>
							Un usage frauduleux peut entraîner la
							suspension/suppression du compte.
						</li>
					</ul>
				</section>
				<section>
					<h2>7. Règles de publication et de comportement</h2>
					<ul className="list-disc pl-6">
						<li>
							Les contenus publiés doivent être licites, exacts et
							non trompeurs.
						</li>
						<li>
							Produits interdits : contrefaçons, substances
							illicites, armes, contenus dangereux ou contraires à
							l&apos;ordre public.
						</li>
						<li>
							Respect d&apos;autrui dans la messagerie et les
							offres. Pas de harcèlement, spam ou propos haineux.
						</li>
						<li>
							La plateforme peut modérer, masquer ou supprimer un
							contenu non conforme.
						</li>
					</ul>
				</section>
				<section>
					<h2>8. Fonctionnement des transactions et paiements</h2>
					<p>
						Les paiements sont traités par Stripe via des comptes
						connectés (Vendeurs). Les fonds sont initialement
						autorisés puis capturés/transférés uniquement après
						validation, afin de protéger acheteurs et vendeurs.
					</p>
					<ul className="list-disc pl-6">
						<li>
							Mécanisme de protection: capture manuelle et/ou
							transfert retardé jusqu&apos;à validation par
							l&apos;acheteur, par un modérateur ou après
							confirmation de livraison.
						</li>
						<li>
							En cas de rejet (litige fondé, absence de preuve
							d&apos;expédition, etc.), la transaction peut être
							annulée et remboursée.
						</li>
						<li>
							Le vendeur doit avoir configuré un compte Stripe
							valide pour recevoir les fonds.
						</li>
					</ul>
					<p className="text-sm">
						Pour plus d&apos;informations sur Stripe, consulter
						leurs conditions :
						<a
							className="underline"
							href="https://stripe.com/fr/legal"
							target="_blank"
							rel="noopener noreferrer"
						>
							stripe.com/fr/legal
						</a>
						.
					</p>
				</section>
				<section>
					<h2>9. Expédition, suivi et preuves</h2>
					<ul className="list-disc pl-6">
						<li>
							Le vendeur s&apos;engage à expédier le produit dans
							des délais raisonnables et à fournir un numéro de
							suivi valide.
						</li>
						<li>
							Des preuves d&apos;expédition et/ou de livraison
							peuvent être demandées et vérifiées par la
							plateforme.
						</li>
						<li>
							À confirmation de livraison ou validation, le
							paiement est capturé/transféré au vendeur.
						</li>
					</ul>
				</section>
				<section>
					<h2>10. Messagerie et offres</h2>
					<ul className="list-disc pl-6">
						<li>
							Les utilisateurs peuvent échanger via la messagerie
							intégrée et formuler des offres.
						</li>
						<li>
							Les échanges restent privés. La plateforme peut
							intervenir en cas de signalement ou d&apos;abus.
						</li>
					</ul>
				</section>
				<section>
					<h2>11. Frais et commissions</h2>
					<p>
						Des frais de service et commissions de plateforme
						peuvent être appliqués, variables selon le montant et/ou
						l&apos;activité du vendeur. Ils sont indiqués avant
						validation du paiement.
					</p>
				</section>
				<section>
					<h2>12. Responsabilités</h2>
					<ul className="list-disc pl-6">
						<li>
							La plateforme est un intermédiaire technique et
							n&apos;est pas partie au contrat de vente entre
							utilisateurs.
						</li>
						<li>
							Les vendeurs sont seuls responsables des annonces,
							de la conformité et de l&apos;expédition des
							produits.
						</li>
						<li>
							L&apos;acheteur doit vérifier les informations avant
							l&apos;achat et utiliser les mécanismes de
							protection disponibles.
						</li>
						<li>
							La plateforme décline toute responsabilité en cas de
							force majeure, indisponibilité ou usage non conforme
							des services.
						</li>
					</ul>
				</section>
				<section>
					<h2>13. Interdictions</h2>
					<ul className="list-disc pl-6">
						<li>
							Contourner les systèmes de paiement ou échanger hors
							plateforme.
						</li>
						<li>
							Usurper l&apos;identité d&apos;un tiers, diffuser
							des malwares, extraire des données (scraping non
							autorisé).
						</li>
						<li>
							Publier des contenus illicites, discriminatoires,
							violents, pornographiques ou contraires aux lois
							applicables.
						</li>
					</ul>
				</section>
				<section>
					<h2>14. Signalement et modération</h2>
					<p>
						Tout utilisateur peut signaler un contenu ou un
						comportement inapproprié. La plateforme se réserve le
						droit de retirer un contenu, suspendre un compte ou
						annuler une transaction en cas de violation des CGU ou
						de risque manifeste de fraude.
					</p>
				</section>
				<section>
					<h2>15. Données personnelles et cookies</h2>
					<p>
						Le traitement des données et l&apos;utilisation des
						cookies sont détaillés dans notre{" "}
						<Link
							href="/legal/politique-de-confidentialite"
							className="underline"
						>
							Politique de confidentialité
						</Link>
						.
					</p>
				</section>
				<section>
					<h2>16. Propriété intellectuelle</h2>
					<p>
						Les éléments du site (marques, logos, textes, images,
						code, etc.) sont protégés. Toute reproduction non
						autorisée est interdite.
					</p>
				</section>
				<section>
					<h2>17. Suspension, résiliation</h2>
					<p>
						En cas de non-respect des CGU, d&apos;activité
						frauduleuse ou de risque pour la sécurité, la plateforme
						peut suspendre ou supprimer un compte, et prendre toute
						mesure nécessaire de prévention.
					</p>
				</section>
				<section>
					<h2>18. Garanties et limitation de responsabilité</h2>
					<p>
						Les services sont fournis « en l&apos;état ». Sous
						réserve des dispositions légales impératives, la
						plateforme ne saurait être tenue responsable des
						dommages indirects, pertes de données ou préjudices
						immatériels.
					</p>
				</section>
				<section>
					<h2>19. Droit applicable et juridiction</h2>
					<p>
						Les présentes CGU sont soumises au droit français. Tout
						litige relatif à leur interprétation ou exécution relève
						des tribunaux français compétents.
					</p>
				</section>
				<section>
					<h2>20. Contact</h2>
					<p>
						Pour toute question, vous pouvez consulter les
						<Link href="/legal/cgv" className="underline">
							{" "}
							CGV
						</Link>{" "}
						et nous contacter via les coordonnées des
						<Link
							href="/legal/mentions-legales"
							className="underline"
						>
							{" "}
							Mentions légales
						</Link>
						.
					</p>
					<p className="text-xs text-muted-foreground">
						Dernière mise à jour : 13/08/2025
					</p>
				</section>
			</main>
			<Footer />
		</>
	);
}
