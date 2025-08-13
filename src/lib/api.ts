import { handleApiError } from "./error-handler";

/**
 * Utility function to get the base URL for API calls
 * Uses NEXT_PUBLIC_APP_URL environment variable or falls back to localhost:3000
 */
export const getBaseURL = (): string => {
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

	try {
		const response = await fetch(url, options);

		// Gérer automatiquement les erreurs HTTP
		if (!response.ok) {
			handleApiError(response, errorMessage);
		}

		return response;
	} catch (error) {
		// Gérer les erreurs de réseau
		handleApiError(
			new Response(null, { status: 0, statusText: "Network Error" }),
			errorMessage || "Erreur de connexion"
		);
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
