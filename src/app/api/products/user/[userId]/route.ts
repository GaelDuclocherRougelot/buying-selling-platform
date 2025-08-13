import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/products/user/{userId}:
 *   get:
 *     summary: Récupérer les produits d'un utilisateur
 *     description: Récupère la liste des produits d'un utilisateur spécifique avec filtres optionnels
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur dont on veut récupérer les produits
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Statut des produits à filtrer (approved, pending, sold, etc.)
 *     responses:
 *       200:
 *         description: Liste des produits récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Products'
 *       404:
 *         description: Utilisateur non trouvé ou aucun produit
 *       500:
 *         description: Erreur interne du serveur
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	return handleApiRoute(async () => {
		const { userId } = await params;
		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");

		const where: Prisma.ProductWhereInput = { ownerId: userId };
		if (status) {
			where.status = status;
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
		});

		return products;
	});
}
