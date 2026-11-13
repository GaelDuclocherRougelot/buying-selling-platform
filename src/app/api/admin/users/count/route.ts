import { handleApiRoute } from "@/lib/api-error-handler";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const admin = await requireAdmin(request);
	if (admin instanceof NextResponse) return admin;
	return handleApiRoute(async () => {
		const userCount = await prisma.user.count({
			where: { role: "user" },
		});

		return { count: userCount };
	});
}
