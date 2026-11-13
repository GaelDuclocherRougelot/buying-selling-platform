import { handleApiRoute } from '@/lib/api-error-handler';
import { prisma } from '@/lib/prisma';
import { logSqliSuspected } from '@/lib/security-log';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

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
    await logSqliSuspected(
      request.headers,
      request.nextUrl.pathname,
      Object.fromEntries(searchParams),
    );
    const query = searchParams.get('q');
    const categoryId = searchParams.get('categoryId');
    // Le filtre de /search envoie le nom technique de la catégorie
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    // Valeurs sûres : jamais de NaN vers Prisma (sinon 500 sur saisie non numérique)
    const page = Math.max(1, Math.trunc(Number(searchParams.get('page'))) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Math.trunc(Number(searchParams.get('limit'))) || 20),
    );
    const offset = (page - 1) * limit;

    // Note: "q" is optional to allow the generic /search page to load

    // Annonces publiées : statut "active" ("approved" n'est jamais attribué)
    const where: Prisma.ProductWhereInput = {
      status: 'active',
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (category) {
      where.category = {
        is: {
          OR: [{ id: category }, { name: category }, { displayName: category }],
        },
      };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      const gte = parseFloat(minPrice ?? '');
      const lte = parseFloat(maxPrice ?? '');
      if (Number.isFinite(gte)) where.price.gte = gte;
      if (Number.isFinite(lte)) where.price.lte = lte;
    }

    if (condition) {
      where.condition = condition;
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
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
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
      },
    };
  });
}
