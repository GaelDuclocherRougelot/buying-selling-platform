import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Récupérer les produits mis en avant
 *     description: Récupère une liste de produits récents approuvés pour la page d'accueil
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre maximum de produits à retourner
 *     responses:
 *       200:
 *         description: Produits mis en avant récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Products'
 *       500:
 *         description: Erreur interne du serveur
 */

export async function GET(request: NextRequest) {
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "10");

		const featuredProducts = await prisma.product.findMany({
			where: {
				status: "active",
			},
			include: {
				category: true,
				owner: {
					select: {
						id: true,
						displayUsername: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
		});

		return featuredProducts;
	});
}
