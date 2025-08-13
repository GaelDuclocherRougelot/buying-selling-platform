import { handleApiRoute } from "@/lib/api-error-handler";
import { getAllCategories } from "@/services/category";

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Récupérer toutes les catégories
 *     description: Récupère la liste complète des catégories disponibles
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Liste des catégories récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Erreur interne du serveur
 */

export async function GET() {
	return handleApiRoute(async () => {
		const categories = await getAllCategories();
		return categories;
	});
}
