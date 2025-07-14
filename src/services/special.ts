import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
	const [productCount, categoryCount] = await Promise.all([
		prisma.product.count({
			where: {
				status: "active",
			},
		}),
		prisma.category.count(),
	]);

	return {
		productCount: productCount || 0,
		categoryCount: categoryCount || 0,
	};
}
