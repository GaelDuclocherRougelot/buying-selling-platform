import { handleApiRoute } from "@/lib/api-error-handler";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const admin = await requireAdmin(request);
	if (admin instanceof NextResponse) return admin;
	return handleApiRoute(async () => {
		// Récupérer les statistiques du dashboard
		const [totalUsers, totalProducts, totalCategories, totalRevenue] =
			await Promise.all([
				prisma.user.count({ where: { role: "user" } }),
				prisma.product.count({ where: { status: "active" } }),
				prisma.category.count(),
				prisma.payment.aggregate({
					where: {
						status: "succeeded",
					},
					_count: {
						id: true,
					},
					_sum: {
						applicationFeeAmount: true,
					},
				}),
			]);
			const dashboardStats = {
				totalUsers,
				totalProducts,
				totalCategories,
				totalRevenue: totalRevenue._sum.applicationFeeAmount || 0,
				salesCount: totalRevenue._count.id || 0,
			};
			console.log(dashboardStats);

		return dashboardStats;
	});
}
