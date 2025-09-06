import Header from "@/components/global/Header";
import ConnectAccountButton from "@/components/stripe/ConnectAccountButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VerifiedUser from "@/components/ui/verified-user";
import { getUser } from "@/lib/auth-session";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductsTable } from "../../../features/product/ProductUserTable";
import LogOutButton from "./_components/LogOutButton";

export const metadata: Metadata = {
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
	openGraph: {
		title: "Profil - Plateforme d'Achat et de Vente",
		description:
			"Gérez votre profil utilisateur, vos informations personnelles et vos paramètres de compte.",
		url: "/auth/profile",
	},
	twitter: {
		title: "Profil - Plateforme d'Achat et de Vente",
		description:
			"Gérez votre profil utilisateur, vos informations personnelles et vos paramètres de compte.",
	},
};

/**
 * Profile Page
 *
 * This page displays the user's profile information.
 * @protected
 * @requiresAuthentication
 */
const ProfilePage = async () => {
	const user = await getUser();

	if (!user) {
		return <div>Vous n&apos;êtes pas connecté</div>;
	}

	const getStripeStatusBadge = () => {
		if (!user.stripeAccountId) {
			return <Badge variant="secondary">Non configuré</Badge>;
		}

		switch (user.stripeAccountStatus) {
			case "active":
				return (
					<Badge
						variant="default"
						className="bg-green-100 text-green-800"
					>
						✅ Actif
					</Badge>
				);
			case "charges_only":
				return (
					<Badge
						variant="secondary"
						className="bg-blue-100 text-blue-800"
					>
						💳 Paiements activés
					</Badge>
				);
			case "pending":
				return (
					<Badge
						variant="secondary"
						className="bg-orange-100 text-orange-800"
					>
						⚠️ En attente
					</Badge>
				);
			default:
				return <Badge variant="secondary">Non configuré</Badge>;
		}
	};

	const canSell =
		user.stripeAccountStatus === "active" ||
		user.stripeAccountStatus === "charges_only";

	return (
		<>
			<Header />
			<main className="flex justify-center px-4 lg:px-10 py-8">
				<Card className="flex flex-col gap-10 w-full max-w-[1300px] h-fit">
					<CardHeader className="flex flex-col lg:flex-row justify-between lg:items-center border-b pb-4">
						<div className="flex items-center space-x-4">
							<Avatar className="h-16 w-16">
								<AvatarImage
									src={
										user?.image ||
										"https://via.placeholder.com/150"
									}
									className="object-cover"
									alt="User Avatar"
								/>
								<AvatarFallback className="font-bold">
									{user?.name
										? user.name
												.split(" ")
												.map((n) => n[0])
												.join("")
										: "NA"}
								</AvatarFallback>
							</Avatar>
							<div className="text-lg font-semibold">
								<CardTitle className="flex gap-2">
									{user.username || user?.name.split(" ")[0]}
									{user.emailVerified && <VerifiedUser />}
								</CardTitle>
							</div>
						</div>
						<div className="flex gap-2 mt-4 lg:mt-0">
							<Link href="/auth/profile/edit">
								<Button variant="default">
									Paramètres du compte
								</Button>
							</Link>
							<LogOutButton />
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Stripe Connect Section */}
						<div className="border rounded-lg p-6">
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold">
									Compte Stripe Connect
								</h2>
								{getStripeStatusBadge()}
							</div>

							{!user.stripeAccountId ? (
								<div className="space-y-3">
									<p className="text-gray-600">
										Créez un compte Stripe Connect pour
										vendre des produits et recevoir des
										paiements.
									</p>
									<ConnectAccountButton mode="create" />
								</div>
							) : user.stripeAccountStatus === "active" ? (
								<div className="space-y-3">
									<p className="text-green-600 font-medium">
										✅ Votre compte Stripe est complètement
										actif
									</p>
									<p className="text-sm text-gray-600">
										Vous pouvez vendre des produits et
										recevoir des paiements directement sur
										votre compte bancaire.
									</p>
								</div>
							) : user.stripeAccountStatus === "charges_only" ? (
								<div className="space-y-3">
									<p className="text-blue-600 font-medium">
										💳 Votre compte Stripe peut recevoir des
										paiements
									</p>
									<p className="text-sm text-gray-600">
										Vous pouvez vendre des produits. Pour
										recevoir les paiements sur votre compte
										bancaire, complétez la configuration de
										votre compte Stripe.
									</p>
									<ConnectAccountButton mode="onboarding" />
								</div>
							) : (
								<div className="space-y-3">
									<p className="text-orange-600 font-medium">
										⚠️ Votre compte Stripe nécessite une
										configuration
									</p>
									<p className="text-sm text-gray-600">
										Complétez votre profil Stripe pour
										activer votre compte vendeur.
									</p>
									<ConnectAccountButton mode="onboarding" />
								</div>
							)}
						</div>

						{/* Capacités utilisateur */}
						<div className="border rounded-lg p-6">
							<h2 className="text-xl font-semibold mb-4">
								Mes Capacités
							</h2>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-medium">
											Acheter des produits
										</h3>
										<p className="text-sm text-gray-600">
											Payer avec votre carte bancaire
										</p>
									</div>
									<Badge
										variant="default"
										className="bg-green-100 text-green-800"
									>
										✅ Disponible
									</Badge>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-medium">
											Vendre des produits
										</h3>
										<p className="text-sm text-gray-600">
											Recevoir des paiements sur votre
											compte
										</p>
										<p className="text-sm text-gray-600">
											La plateforme prend 5% d&apos;une
											vente.
											<br />
											Le reste est versé sur votre compte
											bancaire.
										</p>
									</div>
									{canSell ? (
										<Badge
											variant="default"
											className="bg-green-100 text-green-800"
										>
											✅ Disponible
										</Badge>
									) : (
										<Badge
											variant="secondary"
											className="bg-gray-100 text-gray-800"
										>
											🔒 Non disponible
										</Badge>
									)}
								</div>
							</div>
						</div>

						{/* Products Section - seulement si vendeur actif */}
						{canSell && (
							<div>
								<h2 className="text-xl font-semibold mb-4">
									Mes annonces
								</h2>
								<ProductsTable />
							</div>
						)}

						{/* Lien vers la page des commandes */}
						<div>
							<h2 className="text-xl font-semibold mb-4">
								Gestion des commandes
							</h2>
							<div className="text-sm text-gray-600 mb-4">
								<p>
									Accédez à la page dédiée pour gérer vos
									commandes en tant qu&apos;acheteur et
									vendeur.
									<br />
									<strong>Fonctionnalités :</strong> Suivi des
									achats, preuves d&apos;expédition, gestion
									des ventes.
								</p>
							</div>
							<Link href="/auth/orders">
								<Button className="w-full">
									Voir mes commandes
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</main>
		</>
	);
};

export default ProfilePage;
