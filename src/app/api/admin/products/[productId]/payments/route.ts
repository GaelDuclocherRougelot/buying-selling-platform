import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		// Vérifier que l'utilisateur est admin
		if (user.role !== "admin") {
			return NextResponse.json(
				{ error: "Accès refusé" },
				{ status: 403 }
			);
		}

		const { productId } = await params;
		if (!productId) {
			return NextResponse.json(
				{ error: "ID de produit manquant" },
				{ status: 400 }
			);
		}

		// Récupérer tous les paiements pour ce produit avec les informations utilisateur
		const payments = await prisma.payment.findMany({
			where: {
				productId: productId,
			},
			include: {
				product: {
					include: {
						category: true,
					},
				},
				buyer: {
					select: {
						id: true,
						username: true,
						email: true,
					},
				},
				seller: {
					select: {
						id: true,
						username: true,
						email: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(payments);
	} catch (error) {
		console.error("Erreur lors de la récupération des paiements:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
