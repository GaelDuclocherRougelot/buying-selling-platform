import cloudinary from "@/lib/cloudinary";
import { productImagePublicId } from "@/lib/cloudinary-url";
import { prisma } from "@/lib/prisma";

/**
 * Test function to validate URL extraction
 * @param url - Test URL
 */
export function testUrlExtraction(url: string): void {
	console.log("=== Test d'extraction d'URL ===");
	console.log("URL d'entrée:", url);
	const publicId = extractPublicIdFromUrl(url);
	console.log("ID public extrait:", publicId);
	console.log("=== Fin du test ===");
}

/**
 * Extrait l'ID public d'une URL Cloudinary.
 * Limité aux images produit de notre cloud : une URL fournie par un client ne
 * doit jamais permettre de détruire un autre asset (profil, preuve, message…).
 * @param url - L'URL Cloudinary complète
 * @returns L'ID public de l'image, ou null si l'URL n'est pas acceptée
 */
export function extractPublicIdFromUrl(url: string): string | null {
	return productImagePublicId(url);
}

/**
 * Supprime une image de Cloudinary
 * @param url - L'URL de l'image à supprimer
 * @returns Promise<boolean> - true si supprimé avec succès
 */
export async function deleteImageFromCloudinary(url: string): Promise<boolean> {
	try {
		const publicId = extractPublicIdFromUrl(url);
		if (!publicId) {
			console.error("Impossible d'extraire l'ID public de l'URL:", url);
			return false;
		}

		console.log(
			"Tentative de suppression de l'image avec l'ID public:",
			publicId
		);

		const result = await cloudinary.uploader.destroy(publicId);
		console.log("Résultat de la suppression Cloudinary:", result);

		const success = result.result === "ok";
		if (!success) {
			console.error("Échec de la suppression Cloudinary:", result);
		}

		return success;
	} catch (error) {
		console.error("Erreur lors de la suppression de l'image:", error);
		return false;
	}
}

/**
 * Supprime plusieurs images de Cloudinary
 * @param urls - Array d'URLs d'images à supprimer
 * @returns Promise<{ success: number, failed: number }>
 */
export async function deleteMultipleImagesFromCloudinary(
	urls: string[]
): Promise<{ success: number; failed: number }> {
	const results = await Promise.allSettled(
		urls.map((url) => deleteImageFromCloudinary(url))
	);

	const success = results.filter(
		(result) => result.status === "fulfilled" && result.value
	).length;

	const failed = results.length - success;

	return { success, failed };
}

/**
 * Supprime les images d'un produit, sauf celles encore référencées par un
 * autre produit : copier l'URL d'autrui dans son annonce ne permet pas de la
 * détruire.
 */
export async function deleteProductImagesFromCloudinary(
	productId: string,
	urls: string[]
): Promise<{ success: number; failed: number }> {
	const shared = await prisma.product.findMany({
		where: { id: { not: productId }, imagesUrl: { hasSome: urls } },
		select: { imagesUrl: true },
	});
	const used = new Set(shared.flatMap((p) => p.imagesUrl));
	return deleteMultipleImagesFromCloudinary(urls.filter((u) => !used.has(u)));
}
