import { ApiErrorHandler, handleApiRoute } from "@/lib/api-error-handler";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

// Seul displayUsername est modifiable ; l'email ne peut pas être changé ici
// (prise de contrôle de compte). Les autres clés sont ignorées.
const updateUserSchema = z.object({
	displayUsername: z.string().nullable().optional(),
	email: z.never().optional(),
});

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
 *                 nullable: true
 *                 description: Nouveau nom d'utilisateur (null pour l'effacer). Les autres champs sont ignorés ; envoyer `email` est refusé (400).
 *                 example: "john_doe_new"
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
 *         description: Données de requête invalides (y compris toute tentative de modification de l'email)
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (l'utilisateur connecté n'est pas le propriétaire du profil)
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

		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user) {
			throw ApiErrorHandler.createAuthErrorResponse();
		}
		if (session.user.id !== userId) {
			throw ApiErrorHandler.createForbiddenErrorResponse();
		}

		const parseResult = updateUserSchema.safeParse(await request.json());
		if (!parseResult.success) {
			throw ApiErrorHandler.createErrorResponse(
				new Error("Données de requête invalides"),
				400,
				"VALIDATION_ERROR",
				parseResult.error.flatten()
			);
		}
		const { displayUsername } = parseResult.data;

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				displayUsername,
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
