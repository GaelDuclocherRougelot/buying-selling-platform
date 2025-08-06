import { getUser } from "@/lib/auth-session";
import {
	getUserBuyerOrders,
	getUserOrderStats,
	getUserSellerOrders,
} from "@/services/orders";
import { Order } from "@/types/order";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type"); // "buyer", "seller", ou "all"
		const includeStats = searchParams.get("stats") === "true";

		let buyerOrders: Order[] = [];
		let sellerOrders: Order[] = [];
		let stats = null;

		// Récupérer les commandes selon le type demandé
		if (type === "buyer" || type === "all" || !type) {
			buyerOrders = await getUserBuyerOrders(user.id);
		}

		if (type === "seller" || type === "all" || !type) {
			sellerOrders = await getUserSellerOrders(user.id);
		}

		// Récupérer les statistiques si demandé
		if (includeStats) {
			stats = await getUserOrderStats(user.id);
		}

		return NextResponse.json({
			buyerOrders,
			sellerOrders,
			stats,
		});
	} catch (error) {
		console.error("Erreur lors de la récupération des commandes:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
