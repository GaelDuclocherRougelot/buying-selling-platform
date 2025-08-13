import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Récupérer la liste des produits
 *     description: Récupère une liste paginée de produits avec filtres optionnels
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: ID de la catégorie pour filtrer les produits
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Terme de recherche pour filtrer par titre ou description
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Prix minimum pour filtrer les produits
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Prix maximum pour filtrer les produits
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *         description: État du produit (NEW, GOOD, FAIR, POOR)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre maximum de produits à retourner
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Nombre de produits à ignorer pour la pagination
 *     responses:
 *       200:
 *         description: Liste des produits récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Products'
 *       400:
 *         description: Paramètres de requête invalides
 *       500:
 *         description: Erreur interne du serveur
 */

export async function GET(request: NextRequest) {
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		const categoryId = searchParams.get("categoryId");
		const search = searchParams.get("search");
		const minPrice = searchParams.get("minPrice");
		const maxPrice = searchParams.get("maxPrice");
		const condition = searchParams.get("condition");
		const limit = parseInt(searchParams.get("limit") || "20");
		const offset = parseInt(searchParams.get("offset") || "0");

		const where: Prisma.ProductWhereInput = {
			status: "approved",
		};

		if (categoryId) {
			where.categoryId = categoryId;
		}

		if (search) {
			where.OR = [
				{ title: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			];
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

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Créer un nouveau produit
 *     description: Crée un nouveau produit avec les informations fournies
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - condition
 *               - categoryId
 *               - ownerId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Titre du produit
 *                 example: "Chaise design"
 *               description:
 *                 type: string
 *                 description: Description détaillée du produit
 *                 example: "Chaise en bois, très bon état"
 *               price:
 *                 type: number
 *                 description: Prix du produit
 *                 example: 49.99
 *               condition:
 *                 type: string
 *                 description: État du produit
 *                 example: "GOOD"
 *               imagesUrl:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URLs des images du produit
 *                 example: ["https://example.com/image1.jpg"]
 *               categoryId:
 *                 type: string
 *                 description: ID de la catégorie du produit
 *                 example: "cat_123"
 *               ownerId:
 *                 type: string
 *                 description: ID du propriétaire du produit
 *                 example: "user_123"
 *               deliveryPrice:
 *                 type: number
 *                 description: Prix de livraison
 *                 example: 5.99
 *               city:
 *                 type: string
 *                 description: Ville où se trouve le produit
 *                 example: "Paris"
 *               delivery:
 *                 type: boolean
 *                 description: Si la livraison est disponible
 *                 example: true
 *     responses:
 *       200:
 *         description: Produit créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Données de requête invalides
 *       500:
 *         description: Erreur interne du serveur
 */
export async function POST(request: NextRequest) {
	return handleApiRoute(async () => {
		const body = await request.json();
		const {
			title,
			description,
			price,
			condition,
			imagesUrl,
			categoryId,
			ownerId,
			deliveryPrice,
			city,
			delivery,
		} = body;

		const product = await prisma.product.create({
			data: {
				title,
				description,
				price: parseFloat(price),
				condition,
				imagesUrl,
				categoryId,
				ownerId,
				deliveryPrice: deliveryPrice ? parseFloat(deliveryPrice) : 0,
				city,
				delivery,
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
		});

		return product;
	});
}
