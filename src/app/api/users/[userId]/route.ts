import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     description: Récupère les informations publiques d'un utilisateur spécifique
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à récupérer
 *     responses:
 *       200:
 *         description: Utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 displayUsername:
 *                   type: string
 *                 email:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	return handleApiRoute(async () => {
		const { userId } = await params;

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				displayUsername: true,
				email: true,
				createdAt: true,
				// Ne pas inclure les informations sensibles
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		return user;
	});
}

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Mettre à jour un utilisateur
 *     description: Met à jour les informations d'un utilisateur spécifique
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayUsername:
 *                 type: string
 *                 description: Nouveau nom d'utilisateur
 *                 example: "john_doe_new"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Nouvelle adresse email
 *                 example: "john.new@example.com"
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 displayUsername:
 *                   type: string
 *                 email:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Données de requête invalides
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	return handleApiRoute(async () => {
		const { userId } = await params;
		const body = await request.json();
		const { displayUsername, email } = body;

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				displayUsername,
				email,
			},
			select: {
				id: true,
				displayUsername: true,
				email: true,
				createdAt: true,
			},
		});

		return updatedUser;
	});
}
