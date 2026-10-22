// Seul hôte produit par l'upload (secure_url) et autorisé par next.config.ts / CSP
const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * Vérifie qu'une valeur est une URL https hébergée sur Cloudinary.
 * Sûr côté client et serveur (ne pas importer "@/lib/cloudinary" ici).
 */
export function isCloudinaryUrl(value: unknown): value is string {
	if (typeof value !== "string") return false;
	try {
		const url = new URL(value);
		return url.protocol === "https:" && url.hostname === CLOUDINARY_HOST;
	} catch {
		return false;
	}
}
