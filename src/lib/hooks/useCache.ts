import { useCallback, useEffect, useState } from "react";

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

interface ClientCache {
	[key: string]: CacheEntry<unknown>;
}

class ClientCacheManager {
	private cache: ClientCache = {};
	private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

	get<T>(key: string): T | null {
		const entry = this.cache[key];

		if (!entry) {
			return null;
		}

		if (Date.now() - entry.timestamp > entry.ttl) {
			delete this.cache[key];
			return null;
		}

		return entry.data as T;
	}

	set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
		this.cache[key] = {
			data,
			timestamp: Date.now(),
			ttl,
		};
	}

	delete(key: string): void {
		delete this.cache[key];
	}

	clear(): void {
		this.cache = {};
	}
}

// Instance singleton pour le cache client
const clientCache = new ClientCacheManager();

/**
 * Hook pour gérer le cache côté client
 */
export function useCache<T>(
	key: string,
	fetchFunction: () => Promise<T>,
	ttl: number = 5 * 60 * 1000
) {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Vérifier le cache d'abord
			const cached = clientCache.get<T>(key);
			if (cached) {
				setData(cached);
				setLoading(false);
				return;
			}

			// Si pas en cache, récupérer et mettre en cache
			const result = await fetchFunction();
			clientCache.set(key, result, ttl);
			setData(result);
		} catch (err) {
			setError(err as Error);
		} finally {
			setLoading(false);
		}
	}, [key, fetchFunction, ttl]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const refetch = useCallback(() => {
		clientCache.delete(key);
		fetchData();
	}, [key, fetchData]);

	const invalidate = useCallback(() => {
		clientCache.delete(key);
	}, [key]);

	return {
		data,
		loading,
		error,
		refetch,
		invalidate,
	};
}

/**
 * Hook pour les données avec cache automatique
 */
export function useCachedData<T>(
	key: string,
	fetchFunction: () => Promise<T>,
	ttl: number = 5 * 60 * 1000
) {
	return useCache(key, fetchFunction, ttl);
}

/**
 * Fonction utilitaire pour invalider le cache client
 */
export function invalidateClientCache(pattern?: string) {
	if (pattern) {
		// Logique pour invalider par pattern si nécessaire
		console.log(`Invalidating client cache pattern: ${pattern}`);
	} else {
		clientCache.clear();
	}
}
