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

export async function getProductWithOwnerById(productId: string) {
	return await prisma.product.findUnique({
		where: { id: productId },
		include: {
			owner: true,
		},
	});
}

/**
 * getAllProducts function retrieves all active products from the database.
 * Excludes sold products from public searches.
 *
 * @returns {Promise<Product[]>} A Promise that resolves to an array of product objects.
 */
export async function getAllProducts() {
	return await prisma.product.findMany({
		where: {
			status: {
				not: "sold", // Exclure les produits vendus
			},
		},
		include: {
			category: true,
		},
	});
}

/**
 * getAllProductsForAdmin function retrieves ALL products including sold ones.
 * Used for admin views and user profiles.
 *
 * @returns {Promise<Product[]>} A Promise that resolves to an array of all product objects.
 */
export async function getAllProductsForAdmin() {
	return await prisma.product.findMany({
		include: {
			category: true,
		},
	});
}

/**
 * getProductsByUserId function retrieves all products for a specific user.
 * Includes sold products for profile display.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Product[]>} A Promise that resolves to an array of product objects.
 */
export async function getProductsByUserId(userId: string) {
	return await prisma.product.findMany({
		where: {
			ownerId: userId,
		},
		include: {
			category: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

/**
 * getLastTenProducts function retrieves the last ten active products from the database.
 *
 * @returns {Promise<Product[]>} A Promise that resolves to an array of product objects.
 */
export async function getLastTenProducts() {
	return await prisma.product.findMany({
		orderBy: { id: "desc" },
		where: {
			status: "active",
		},
		take: 10,
	});
}
