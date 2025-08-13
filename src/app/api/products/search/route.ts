import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Rechercher des produits
 *     description: Recherche des produits avec des filtres avancés et pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche (requis)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: ID de la catégorie pour filtrer les résultats
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Prix minimum pour filtrer les résultats
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Prix maximum pour filtrer les résultats
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *         description: État du produit (new, good, mid, damaged)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre maximum de résultats à retourner
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Nombre de résultats à ignorer pour la pagination
 *     responses:
 *       200:
 *         description: Recherche effectuée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Products'
 *       400:
 *         description: Paramètre de recherche manquant
 *       500:
 *         description: Erreur interne du serveur
 */

export async function GET(request: NextRequest) {
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q");
		const categoryId = searchParams.get("categoryId");
		const minPrice = searchParams.get("minPrice");
		const maxPrice = searchParams.get("maxPrice");
		const condition = searchParams.get("condition");
		const limit = parseInt(searchParams.get("limit") || "20");
		const offset = parseInt(searchParams.get("offset") || "0");

		if (!query) {
			throw new Error("Query parameter 'q' is required");
		}

		const where: Prisma.ProductWhereInput = {
			status: "approved",
			OR: [
				{ title: { contains: query, mode: "insensitive" } },
				{ description: { contains: query, mode: "insensitive" } },
			],
		};

		if (categoryId) {
			where.categoryId = categoryId;
		}

		if (minPrice || maxPrice) {
			where.price = {};
			if (minPrice) where.price.gte = parseFloat(minPrice);
			if (maxPrice) where.price.lte = parseFloat(maxPrice);
		}

		if (condition) {
			where.condition = condition;
		}

		const products = await prisma.product.findMany({
			where,
			include: {
				category: true,
				owner: {
					select: {
						id: true,
						displayUsername: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: limit,
			skip: offset,
		});

		return products;
	});
}
