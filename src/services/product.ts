import { prisma } from "@/lib/prisma";

/**
 * getProductById function retrieves a product by its ID.
 *
 * @param {string} productId - The ID of the product to retrieve.
 * @returns {Promise<Product>} A Promise that resolves to the product object.
 */
export async function getProductById(productId: string) {
	return await prisma.product.findUnique({
		where: { id: productId },
	});
}

/**
 * getAllProducts function retrieves all products from the database.
 *
 * @returns {Promise<Product[]>} A Promise that resolves to an array of product objects.
 */
export async function getAllProducts() {
	return await prisma.product.findMany();
}

/**
 * getLastTenProducts function retrieves the last ten products from the database.
 *
 * @returns {Promise<Product[]>} A Promise that resolves to an array of product objects.
 */
export async function getLastTenProducts() {
	return await prisma.product.findMany({
		orderBy: { id: "desc" },
		take: 10,
	});
}
