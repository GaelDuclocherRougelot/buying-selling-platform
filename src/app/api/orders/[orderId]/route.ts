import { getUser } from "@/lib/auth-session";
import { getOrderById } from "@/services/orders";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ orderId: string }> }
) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		const { orderId } = await params;
		if (!orderId) {
			return NextResponse.json(
				{ error: "ID de commande manquant" },
				{ status: 400 }
			);
		}

		const order = await getOrderById(orderId, user.id);

		if (!order) {
			return NextResponse.json(
				{ error: "Commande non trouvée" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ order });
	} catch (error) {
		console.error("Erreur lors de la récupération de la commande:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
