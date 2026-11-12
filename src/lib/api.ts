import { handleApiError, handleError } from "./error-handler";

/**
 * Utility function to get the base URL for API calls
 * - Navigateur : origine courante (même origine → CSP connect-src 'self',
 *   fonctionne aussi sur les previews Vercel et les domaines alternatifs)
 * - Serveur en preview Vercel : URL du déploiement courant (sinon les appels
 *   et les liens générés côté serveur partent vers la production)
 * - Serveur sinon : NEXT_PUBLIC_APP_URL ou localhost:3000
 */
export const getBaseURL = (): string => {
	if (typeof window !== "undefined") return window.location.origin;
	if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}
	return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

/**
 * Utility function to create API URLs
 * @param endpoint - The API endpoint (e.g., "/api/products")
 * @returns The full API URL
 */
export const createApiURL = (endpoint: string): string => {
	const baseURL = getBaseURL();
	// Remove leading slash if present to avoid double slashes
	const cleanEndpoint = endpoint.startsWith("/")
		? endpoint.slice(1)
		: endpoint;
	return `${baseURL}/${cleanEndpoint}`;
};

/**
 * Utility function for making API calls with the correct base URL and error handling
 * @param endpoint - The API endpoint (e.g., "/api/products")
 * @param options - Fetch options
 * @param errorMessage - Custom error message
 * @returns Promise<Response>
 */
export const apiFetch = async (
	endpoint: string,
	options?: RequestInit,
	errorMessage?: string
): Promise<Response> => {
	const url = createApiURL(endpoint);

	// Preview protégée par Vercel : un appel serveur → preview est refusé (401)
	// sans le secret de contournement, fourni par Vercel s'il est configuré.
	const bypassSecret =
		typeof window === "undefined" && process.env.VERCEL_ENV === "preview"
			? process.env.VERCEL_AUTOMATION_BYPASS_SECRET
			: undefined;
	if (bypassSecret) {
		const headers = new Headers(options?.headers);
		headers.set("x-vercel-protection-bypass", bypassSecret);
		options = { ...options, headers };
	}

	try {
		const response = await fetch(url, options);

		// Gérer automatiquement les erreurs HTTP
		if (!response.ok) {
			handleApiError(response, errorMessage);
		}

		return response;
	} catch (error) {
		// Erreur réseau (ou requête bloquée) : pas de Response HTTP.
		// `new Response(null, { status: 0 })` lève une RangeError qui masquait l'erreur d'origine.
		handleError(error, {
			fallbackMessage: errorMessage || "Erreur de connexion",
		});
		throw error;
	}
};

/**
 * Wrapper pour les requêtes GET avec gestion d'erreur
 */
export const apiGet = async (
	endpoint: string,
	errorMessage?: string
): Promise<Response> => {
	return apiFetch(endpoint, { method: "GET" }, errorMessage);
};

/**
 * Wrapper pour les requêtes POST avec gestion d'erreur
 */
export const apiPost = async (
	endpoint: string,
	data?: unknown,
	errorMessage?: string
): Promise<Response> => {
	return apiFetch(
		endpoint,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: data ? JSON.stringify(data) : undefined,
		},
		errorMessage
	);
};

/**
 * Wrapper pour les requêtes PUT avec gestion d'erreur
 */
export const apiPut = async (
	endpoint: string,
	data?: unknown,
	errorMessage?: string
): Promise<Response> => {
	return apiFetch(
		endpoint,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: data ? JSON.stringify(data) : undefined,
		},
		errorMessage
	);
};

/**
 * Wrapper pour les requêtes DELETE avec gestion d'erreur
 */
export const apiDelete = async (
	endpoint: string,
	errorMessage?: string
): Promise<Response> => {
	return apiFetch(endpoint, { method: "DELETE" }, errorMessage);
};

/**
 * Fonction utilitaire pour extraire les données JSON d'une réponse avec gestion d'erreur
 */
export const apiJson = async <T>(
	response: Response,
	errorMessage?: string
): Promise<T> => {
	try {
		return await response.json();
	} catch (error) {
		handleApiError(
			new Response(null, { status: 500, statusText: "JSON Parse Error" }),
			errorMessage || "Erreur lors du traitement de la réponse"
		);
		throw error;
	}
};
