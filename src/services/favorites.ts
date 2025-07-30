import { prisma } from "@/lib/prisma";

export interface FavoriteWithProduct {
	id: string;
	createdAt: Date;
	product: {
		id: string;
		title: string;
		description: string | null;
		price: number;
		condition: string;
		imagesUrl: string[];
		status: string;
		category: {
			id: string;
			displayName: string;
		};
		owner: {
			id: string;
			name: string;
			username: string | null;
		};
	};
}

/**
 * Get all favorites for a user
 */
export async function getUserFavorites(
	userId: string
): Promise<FavoriteWithProduct[]> {
	return await prisma.favorite.findMany({
		where: {
			userId: userId,
			product: {
				status: "active",
			},
		},
		include: {
			product: {
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
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
}

/**
 * Add a product to user favorites
 */
export async function addToFavorites(
	userId: string,
	productId: string
): Promise<FavoriteWithProduct> {
	// Check if product exists
	const product = await prisma.product.findUnique({
		where: { id: productId },
	});

	if (!product) {
		throw new Error("Product not found");
	}

	// Check if already favorited
	const existingFavorite = await prisma.favorite.findUnique({
		where: {
			userId_productId: {
				userId: userId,
				productId: productId,
			},
		},
	});

	if (existingFavorite) {
		throw new Error("Product already in favorites");
	}

	return await prisma.favorite.create({
		data: {
			userId: userId,
			productId: productId,
		},
		include: {
			product: {
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
			},
		},
	});
}

/**
 * Remove a product from user favorites
 */
export async function removeFromFavorites(
	userId: string,
	productId: string
): Promise<void> {
	const favorite = await prisma.favorite.findUnique({
		where: {
			userId_productId: {
				userId: userId,
				productId: productId,
			},
		},
	});

	if (!favorite) {
		throw new Error("Favorite not found");
	}

	await prisma.favorite.delete({
		where: {
			userId_productId: {
				userId: userId,
				productId: productId,
			},
		},
	});
}

/**
 * Check if a product is in user favorites
 */
export async function isProductInFavorites(
	userId: string,
	productId: string
): Promise<boolean> {
	const favorite = await prisma.favorite.findUnique({
		where: {
			userId_productId: {
				userId: userId,
				productId: productId,
			},
		},
	});

	return !!favorite;
}

/**
 * Get favorite count for a product
 */
export async function getProductFavoriteCount(
	productId: string
): Promise<number> {
	return await prisma.favorite.count({
		where: {
			productId: productId,
		},
	});
}
