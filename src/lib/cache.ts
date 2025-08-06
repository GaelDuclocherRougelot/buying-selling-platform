// Types pour le cache
interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number; // Time to live en millisecondes
}

interface CacheStore {
	[key: string]: CacheEntry<unknown>;
}

class CacheManager {
	private cache: CacheStore = {};
	public readonly defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut

	/**
	 * Récupère une valeur du cache
	 */
	get<T>(key: string): T | null {
		const entry = this.cache[key];

		if (!entry) {
			return null;
		}

		// Vérifier si l'entrée a expiré
		if (Date.now() - entry.timestamp > entry.ttl) {
			delete this.cache[key];
			return null;
		}

		return entry.data as T;
	}

	/**
	 * Stocke une valeur dans le cache
	 */
	set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
		this.cache[key] = {
			data,
			timestamp: Date.now(),
			ttl,
		};
	}

	/**
	 * Supprime une entrée du cache
	 */
	delete(key: string): void {
		delete this.cache[key];
	}

	/**
	 * Supprime toutes les entrées du cache
	 */
	clear(): void {
		this.cache = {};
	}

	/**
	 * Supprime les entrées expirées
	 */
	cleanup(): void {
		const now = Date.now();
		Object.keys(this.cache).forEach((key) => {
			const entry = this.cache[key];
			if (now - entry.timestamp > entry.ttl) {
				delete this.cache[key];
			}
		});
	}

	/**
	 * Génère une clé de cache basée sur les paramètres
	 */
	generateKey(prefix: string, params: Record<string, unknown> = {}): string {
		const sortedParams = Object.keys(params)
			.sort()
			.map((key) => `${key}:${params[key]}`)
			.join("|");

		return sortedParams ? `${prefix}:${sortedParams}` : prefix;
	}

	/**
	 * Invalide le cache pour un pattern de clés
	 */
	invalidatePattern(pattern: string): void {
		Object.keys(this.cache).forEach((key) => {
			if (key.includes(pattern)) {
				delete this.cache[key];
			}
		});
	}
}

// Instance singleton du cache
export const cache = new CacheManager();

// Nettoyage automatique toutes les 10 minutes
if (typeof window === "undefined") {
	setInterval(
		() => {
			cache.cleanup();
		},
		10 * 60 * 1000
	);
}

// Clés de cache prédéfinies
export const CACHE_KEYS = {
	FEATURED_PRODUCTS: "featured_products",
	FEATURED_CATEGORIES: "featured_categories",
	ALL_CATEGORIES: "all_categories",
	PRODUCTS_BY_CATEGORY: "products_by_category",
	USER_PROFILE: "user_profile",
	USER_PRODUCTS: "user_products",
	PRODUCT_DETAILS: "product_details",
} as const;

// TTL spécifiques pour différents types de données
export const CACHE_TTL = {
	FEATURED_PRODUCTS: 10 * 60 * 1000, // 10 minutes
	FEATURED_CATEGORIES: 30 * 60 * 1000, // 30 minutes
	ALL_CATEGORIES: 60 * 60 * 1000, // 1 heure
	PRODUCTS_BY_CATEGORY: 5 * 60 * 1000, // 5 minutes
	USER_PROFILE: 15 * 60 * 1000, // 15 minutes
	USER_PRODUCTS: 5 * 60 * 1000, // 5 minutes
	PRODUCT_DETAILS: 10 * 60 * 1000, // 10 minutes
} as const;

// Fonctions utilitaires pour le cache
export const cacheUtils = {
	/**
	 * Wrapper pour les fonctions de service avec cache
	 */
	async withCache<T>(
		key: string,
		fetchFunction: () => Promise<T>,
		ttl: number = cache.defaultTTL
	): Promise<T> {
		// Vérifier le cache d'abord
		const cached = cache.get<T>(key);
		if (cached) {
			return cached;
		}

		// Si pas en cache, récupérer et mettre en cache
		const data = await fetchFunction();
		cache.set(key, data, ttl);
		return data;
	},

	/**
	 * Invalide le cache pour un pattern de clés
	 */
	invalidatePattern(pattern: string): void {
		Object.keys(cache["cache"]).forEach((key) => {
			if (key.includes(pattern)) {
				cache.delete(key);
			}
		});
	},

	/**
	 * Invalide le cache pour les produits (quand un produit est modifié)
	 */
	invalidateProducts(): void {
		cache.invalidatePattern("products");
		cache.invalidatePattern("featured_products");
	},

	/**
	 * Invalide le cache pour les catégories
	 */
	invalidateCategories(): void {
		cache.invalidatePattern("categories");
	},
};
