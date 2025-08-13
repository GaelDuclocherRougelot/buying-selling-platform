import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Récupérer les favoris d'un utilisateur
 *     description: Récupère la liste des produits favoris d'un utilisateur spécifique
 *     tags: [Favorites]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur dont on veut récupérer les favoris
 *     responses:
 *       200:
 *         description: Liste des favoris récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   productId:
 *                     type: string
 *                   product:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       price:
 *                         type: number
 *                       imagesUrl:
 *                         type: array
 *                         items:
 *                           type: string
 *                       category:
 *                         $ref: '#/components/schemas/Category'
 *                       owner:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           displayUsername:
 *                             type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       400:
 *         description: Paramètre userId manquant
 *       500:
 *         description: Erreur interne du serveur
 */

export async function GET(request: NextRequest) {
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			throw new Error("userId parameter is required");
		}

		const favorites = await prisma.favorite.findMany({
			where: {
				userId: userId,
			},
			include: {
				product: {
					include: {
						category: true,
						owner: {
							select: {
								id: true,
								displayUsername: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return favorites;
	});
}

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Ajouter un produit aux favoris
 *     description: Ajoute un produit à la liste des favoris d'un utilisateur
 *     tags: [Favorites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID de l'utilisateur
 *                 example: "user_123"
 *               productId:
 *                 type: string
 *                 description: ID du produit à ajouter aux favoris
 *                 example: "product_456"
 *     responses:
 *       200:
 *         description: Produit ajouté aux favoris avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 productId:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Paramètres manquants ou produit déjà en favoris
 *       500:
 *         description: Erreur interne du serveur
 */
export async function POST(request: NextRequest) {
	return handleApiRoute(async () => {
		const body = await request.json();
		const { userId, productId } = body;

		if (!userId || !productId) {
			throw new Error("userId and productId are required");
		}

		// Vérifier si le favori existe déjà
		const existingFavorite = await prisma.favorite.findFirst({
			where: {
				userId,
				productId,
			},
		});

		if (existingFavorite) {
			throw new Error("Product already in favorites");
		}

		const favorite = await prisma.favorite.create({
			data: {
				userId,
				productId,
			},
			include: {
				product: {
					include: {
						category: true,
						owner: {
							select: {
								id: true,
								displayUsername: true,
							},
						},
					},
				},
			},
		});

		return favorite;
	});
}
