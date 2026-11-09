import {
	createAuthErrorResponse,
	createNotFoundErrorResponse,
	handleApiRoute,
} from "@/lib/api-error-handler";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { securityLog } from "@/lib/security-log";
import { NextRequest } from "next/server";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	return handleApiRoute(async () => {
		// L'identité vient de la session, jamais d'un userId fourni par le client
		const user = await getUser();
		if (!user) {
			await securityLog("authz.unauthenticated", request.headers, {
				path: request.nextUrl.pathname,
				method: "DELETE",
			});
			throw createAuthErrorResponse();
		}

		const { productId } = await params;

		// Seul un favori de l'utilisateur connecté peut être supprimé
		const favorite = await prisma.favorite.findFirst({
			where: {
				userId: user.id,
				productId,
			},
		});

		if (!favorite) {
			throw createNotFoundErrorResponse("Favorite not found");
		}

		// Supprimer le favori
		await prisma.favorite.delete({
			where: {
				id: favorite.id,
			},
		});

		return { message: "Favorite removed successfully" };
	});
}
