import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			throw new Error("userId parameter is required");
		}

		const { productId } = await params;

		// Vérifier si le favori existe
		const favorite = await prisma.favorite.findFirst({
			where: {
				userId,
				productId,
			},
		});

		if (!favorite) {
			throw new Error("Favorite not found");
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
