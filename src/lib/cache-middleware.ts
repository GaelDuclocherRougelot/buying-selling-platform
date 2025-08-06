import { NextRequest, NextResponse } from "next/server";
import { cacheUtils } from "./cache";

/**
 * Middleware pour invalider le cache lors des modifications
 */
export function invalidateCacheOnMutation(
	request: NextRequest,
	response: NextResponse
) {
	const url = request.url;
	const method = request.method;

	// Invalider le cache selon l'endpoint et la méthode
	if (method === "POST" || method === "PUT" || method === "DELETE") {
		if (url.includes("/api/products")) {
			// Invalider le cache des produits
			cacheUtils.invalidateProducts();
		}

		if (url.includes("/api/categories")) {
			// Invalider le cache des catégories
			cacheUtils.invalidateCategories();
		}

		if (url.includes("/api/users")) {
			// Invalider le cache des utilisateurs
			cacheUtils.invalidatePattern("user");
		}
	}

	return response;
}

/**
 * Fonction pour ajouter des headers de cache aux réponses
 */
export function addCacheHeaders(response: NextResponse, maxAge: number = 300) {
	response.headers.set("Cache-Control", `public, max-age=${maxAge}`);
	response.headers.set("Vary", "Accept-Encoding");
	return response;
}

/**
 * Fonction pour ajouter des headers de cache pour les données statiques
 */
export function addStaticCacheHeaders(response: NextResponse) {
	return addCacheHeaders(response, 3600); // 1 heure pour les données statiques
}

/**
 * Fonction pour ajouter des headers de cache pour les données dynamiques
 */
export function addDynamicCacheHeaders(response: NextResponse) {
	return addCacheHeaders(response, 300); // 5 minutes pour les données dynamiques
}
