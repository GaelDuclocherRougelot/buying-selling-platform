import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
	const [productCount, categoryCount, salesData] = await Promise.all([
		prisma.product.count({
			where: {
				status: "active",
			},
		}),
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

	return {
		productCount: productCount || 0,
		categoryCount: categoryCount || 0,
		salesCount: salesData._count.id || 0,
		totalRevenue: salesData._sum.applicationFeeAmount || 0,
	};
}
