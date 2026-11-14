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

/**
 * public_id d'une image produit téléversée par /api/upload/product-pictures sur
 * le cloud de la plateforme (`/<cloud>/image/upload/v123/product-pictures/x.jpg`),
 * sinon null. Tout autre cloud, dossier ou forme d'URL est refusé.
 */
export function productImagePublicId(value: unknown): string | null {
	if (!isCloudinaryUrl(value)) return null;
	const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
	if (!cloud) return null;
	const match = new URL(value).pathname.match(
		/^\/([^/]+)\/image\/upload\/(?:v\d+\/)?(product-pictures\/[^/]+?)\.\w+$/
	);
	if (!match || match[1] !== cloud) return null;
	try {
		const publicId = decodeURIComponent(match[2]);
		// %2F décodé ne doit pas sortir du dossier
		return publicId.split("/").length === 2 ? publicId : null;
	} catch {
		return null;
	}
}

export const isProductImageUrl = (value: unknown): value is string =>
	productImagePublicId(value) !== null;
