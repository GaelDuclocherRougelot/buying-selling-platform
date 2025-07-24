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
 * Utility function for making API calls with the correct base URL
 * @param endpoint - The API endpoint (e.g., "/api/products")
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export const apiFetch = async (
	endpoint: string,
	options?: RequestInit
): Promise<Response> => {
	const url = createApiURL(endpoint);
	return fetch(url, options);
};
