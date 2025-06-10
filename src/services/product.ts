import { prisma } from "@/lib/prisma";

export async function getProductById(productId: number) {
	return await prisma.product.findUnique({
		where: { id: productId },
	});
}

export async function getAllProducts() {
	return await prisma.product.findMany();
}

export async function getLastTenProducts() {
	return await prisma.product.findMany({
		orderBy: { id: "desc" },
		take: 10,
	});
}
