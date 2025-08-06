import { CACHE_KEYS, CACHE_TTL, cacheUtils } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

export async function getAllCategories() {
	return await cacheUtils.withCache(
		CACHE_KEYS.ALL_CATEGORIES,
		async () => {
			const categories = await prisma.category.findMany();
			return categories;
		},
		CACHE_TTL.ALL_CATEGORIES
	);
}

export async function createCategory(
	name: string,
	displayName: string,
	imageUrl: string
) {
	// Vérifier si une catégorie avec ce nom existe déjà
	const existingCategory = await prisma.category.findUnique({
		where: { name },
	});

	if (existingCategory) {
		throw new Error(
			`Une catégorie avec le nom technique "${name}" existe déjà`
		);
	}

	// Vérifier que le nom respecte le format requis (lettres minuscules, chiffres, tirets)
	if (!/^[a-z0-9-]+$/.test(name)) {
		throw new Error(
			"Le nom technique doit contenir uniquement des lettres minuscules, des chiffres et des tirets"
		);
	}

	const category = await prisma.category.create({
		data: { name, displayName, imageUrl },
	});

	// Invalider le cache des catégories après création
	cacheUtils.invalidateCategories();

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

/**
 * Invalide le cache des catégories quand une catégorie est modifiée
 */
export function invalidateCategoryCache() {
	cacheUtils.invalidateCategories();
}
