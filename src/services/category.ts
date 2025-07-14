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
