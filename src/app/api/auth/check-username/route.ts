import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/auth/check-username:
 *   get:
 *     summary: Vérifier la disponibilité d'un nom d'utilisateur
 *     description: Vérifie si un nom d'utilisateur est déjà pris ou disponible
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom d'utilisateur à vérifier
 *     responses:
 *       200:
 *         description: Vérification effectuée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                   description: true si le nom d'utilisateur est disponible, false sinon
 *                   example: true
 *       400:
 *         description: Paramètre username manquant
 *       500:
 *         description: Erreur interne du serveur
 */

export async function GET(request: NextRequest) {
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		const username = searchParams.get("username");

		if (!username) {
			throw new Error("username parameter is required");
		}

		const existingUser = await prisma.user.findUnique({
			where: { username },
		});

		return { available: !existingUser };
	});
}
