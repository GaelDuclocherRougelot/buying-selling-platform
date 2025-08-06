import { cache, CACHE_KEYS, CACHE_TTL, cacheUtils } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

/**
 * getProductById function retrieves a product by its ID.
 *
 * @param {string} productId - The ID of the product to retrieve.
 * @returns {Promise<Product>} A Promise that resolves to the product object.
 */
export async function getProductById(productId: string) {
	return await cacheUtils.withCache(
		`${CACHE_KEYS.PRODUCT_DETAILS}:${productId}`,
		async () => {
			return await prisma.product.findUnique({
				where: { id: productId },
			});
		},
		CACHE_TTL.PRODUCT_DETAILS
	);
}

export async function getProductWithOwnerById(productId: string) {
	return await cacheUtils.withCache(
		`${CACHE_KEYS.PRODUCT_DETAILS}:${productId}:with_owner`,
		async () => {
			return await prisma.product.findUnique({
				where: { id: productId },
				include: {
					owner: true,
				},
			});
		},
		CACHE_TTL.PRODUCT_DETAILS
	);
}

/**
 * getAllProducts function retrieves all active products from the database.
 * Excludes sold products from public searches.
 *
 * @returns {Promise<Product[]>} A Promise that resolves to an array of product objects.
 */
export async function getAllProducts() {
	return await cacheUtils.withCache(
		CACHE_KEYS.ALL_CATEGORIES,
		async () => {
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
		},
		CACHE_TTL.PRODUCTS_BY_CATEGORY
	);
}

/**
 * getAllProductsForAdmin function retrieves ALL products including sold ones.
 * Used for admin views and user profiles.
 *
 * @returns {Promise<Product[]>} A Promise that resolves to an array of all product objects.
 */
export async function getAllProductsForAdmin() {
	return await cacheUtils.withCache(
		`${CACHE_KEYS.ALL_CATEGORIES}:admin`,
		async () => {
			return await prisma.product.findMany({
				include: {
					category: true,
				},
			});
		},
		CACHE_TTL.PRODUCTS_BY_CATEGORY
	);
}

/**
 * getProductsByUserId function retrieves all products for a specific user.
 * Includes sold products for profile display.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Product[]>} A Promise that resolves to an array of product objects.
 */
export async function getProductsByUserId(userId: string) {
	return await cacheUtils.withCache(
		`${CACHE_KEYS.USER_PRODUCTS}:${userId}`,
		async () => {
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
		},
		CACHE_TTL.USER_PRODUCTS
	);
}

/**
 * getLastTenProducts function retrieves the last ten active products from the database.
 *
 * @returns {Promise<ProductWithCategory[]>} A Promise that resolves to an array of product objects with category included.
 */
export async function getLastTenProducts() {
	return await prisma.product.findMany({
		orderBy: { id: "desc" },
		where: {
			status: "active",
		},
		take: 10,
		include: {
			category: true,
		},
	});
}

/**
 * getProductsByCategory function retrieves products filtered by category.
 *
 * @param {string} categoryName - The name of the category to filter by.
 * @returns {Promise<Product[]>} A Promise that resolves to an array of product objects.
 */
export async function getProductsByCategory(categoryName: string) {
	return await cacheUtils.withCache(
		`${CACHE_KEYS.PRODUCTS_BY_CATEGORY}:${categoryName}`,
		async () => {
			return await prisma.product.findMany({
				where: {
					category: {
						name: categoryName,
					},
					status: "active",
				},
				include: {
					category: true,
					owner: {
						select: {
							id: true,
							name: true,
							username: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});
		},
		CACHE_TTL.PRODUCTS_BY_CATEGORY
	);
}

/**
 * Invalide le cache des produits quand un produit est modifié
 */
export function invalidateProductCache(productId?: string) {
	if (productId) {
		cache.delete(`${CACHE_KEYS.PRODUCT_DETAILS}:${productId}`);
		cache.delete(`${CACHE_KEYS.PRODUCT_DETAILS}:${productId}:with_owner`);
	}
	cacheUtils.invalidateProducts();
}
