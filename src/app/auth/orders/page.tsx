import { getUser } from "@/lib/auth-session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OrdersClientPage from "./client-page";

export const metadata: Metadata = {
	title: "Mes Commandes",
	description:
		"Gérez vos commandes en tant qu'acheteur et vendeur. Suivez vos achats et soumettez des preuves d'expédition.",
	keywords: [
		"commandes",
		"achats",
		"ventes",
		"suivi",
		"expédition",
		"livraison",
	],
	openGraph: {
		title: "Mes Commandes - Plateforme d'Achat et de Vente",
		description: "Gérez vos commandes en tant qu'acheteur et vendeur.",
		url: "/auth/orders",
	},
	twitter: {
		title: "Mes Commandes - Plateforme d'Achat et de Vente",
		description: "Gérez vos commandes en tant qu'acheteur et vendeur.",
	},
};

/**
 * Orders Page
 *
 * This page displays user orders as both buyer and seller.
 * @protected
 * @requiresAuthentication
 */
const OrdersPage = async () => {
	const user = await getUser();

	if (!user) {
		redirect("/auth/login");
	}

	return <OrdersClientPage />;
};

export default OrdersPage;
