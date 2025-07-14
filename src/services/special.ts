import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
	const [productCount, categoryCount] = await Promise.all([
		prisma.product.count(),
		prisma.category.count(),
	]);

	return {
		productCount,
		categoryCount,
	};
}
