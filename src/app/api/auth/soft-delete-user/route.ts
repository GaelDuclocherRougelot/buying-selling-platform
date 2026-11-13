import { createForbiddenErrorResponse, handleApiRoute } from "@/lib/api-error-handler";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { securityLog } from "@/lib/security-log";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
	const user = await requireUser(request);
	if (user instanceof NextResponse) return user;
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		// Par défaut : le compte connecté. Un autre userId : admin uniquement.
		const userId = searchParams.get("userId") || user.id;

		if (userId !== user.id && user.role !== "admin") {
			await securityLog("authz.denied", request.headers, {
				path: request.nextUrl.pathname,
				method: request.method,
				userId: user.id,
				targetUserId: userId,
			});
			throw createForbiddenErrorResponse();
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
