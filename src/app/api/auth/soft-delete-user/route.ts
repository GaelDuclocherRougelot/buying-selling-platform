import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!userId) {
			throw new Error("userId parameter is required");
		}

		// Soft delete en mettant à jour le statut
		await prisma.user.update({
			where: { id: userId },
			data: {
				deletedAt: new Date()
			},
		});

		return { message: "User soft deleted successfully" };
	});
}
