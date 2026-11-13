import {
	createAuthErrorResponse,
	createValidationErrorResponse,
	handleApiRoute,
} from "@/lib/api-error-handler";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { securityLog } from "@/lib/security-log";
import { NextRequest } from "next/server";

/**
 * Utilisateur connecté, ou réponse 401 levée (renvoyée par handleApiRoute).
 * L'identité vient toujours de la session, jamais d'un userId fourni par le client.
 */
async function requireUser(request: NextRequest) {
	const user = await getUser();
	if (!user) {
		await securityLog("authz.unauthenticated", request.headers, {
			path: request.nextUrl.pathname,
			method: request.method,
		});
		throw createAuthErrorResponse();
	}
	return user;
}

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Récupérer mes favoris
 *     description: Récupère la liste des produits favoris de l'utilisateur connecté (session)
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Non connecté
 *       500:
 *         description: Erreur interne du serveur
 */

export async function GET(request: NextRequest) {
	return handleApiRoute(async () => {
		const user = await requireUser(request);

		const favorites = await prisma.favorite.findMany({
			where: {
				userId: user.id,
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
 *     description: Ajoute un produit aux favoris de l'utilisateur connecté (session). Idempotent si le produit est déjà en favori.
 *     tags: [Favorites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
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
 *         description: productId manquant
 *       401:
 *         description: Non connecté
 *       500:
 *         description: Erreur interne du serveur
 */
export async function POST(request: NextRequest) {
	return handleApiRoute(async () => {
		const user = await requireUser(request);
		const { productId } = await request.json();

		// Chaîne obligatoire : un objet ({ not: "" }…) deviendrait un filtre Prisma
		if (typeof productId !== "string" || !productId) {
			throw createValidationErrorResponse([], "productId is required");
		}

		const include = {
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
		};

		// Ajout idempotent : un favori déjà présent est simplement renvoyé
		const existingFavorite = await prisma.favorite.findFirst({
			where: {
				userId: user.id,
				productId,
			},
			include,
		});

		if (existingFavorite) {
			return existingFavorite;
		}

		const favorite = await prisma.favorite.create({
			data: {
				userId: user.id,
				productId,
			},
			include,
		});

		return favorite;
	});
}
