import { prisma } from "@/lib/prisma";

export async function getAllCategories() {
	const categories = await prisma.category.findMany();
	return categories;
}

export async function createCategory(name: string, displayName: string) {
	const category = await prisma.category.create({
		data: { name, displayName },
	});
	return category;
}

export async function getTopCategoriesByProductCount(limit: number = 10) {
	const categories = await prisma.category.findMany({
		include: {
			_count: {
				select: { products: true },
			},
		},
		orderBy: {
			products: {
				_count: "desc",
			},
		},
		take: limit,
	});
	return categories;
}

