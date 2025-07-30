import cloudinary from "@/lib/cloudinary";

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
 * Extrait l'ID public d'une URL Cloudinary
 * @param url - L'URL Cloudinary complète
 * @returns L'ID public de l'image
 */
export function extractPublicIdFromUrl(url: string): string | null {
	try {
		console.log("Tentative d'extraction de l'ID public depuis:", url);

		// Vérifier que c'est bien une URL Cloudinary
		if (!url.includes("cloudinary.com")) {
			console.error("URL ne semble pas être une URL Cloudinary valide");
			return null;
		}

		// Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image_name.jpg
		const urlParts = url.split("/");
		const uploadIndex = urlParts.findIndex((part) => part === "upload");

		if (uploadIndex === -1) {
			console.error("Partie 'upload' non trouvée dans l'URL");
			return null;
		}

		// Prendre tout ce qui suit 'upload' jusqu'à la fin
		const pathAfterUpload = urlParts.slice(uploadIndex + 1);
		const fullPath = pathAfterUpload.join("/");

		console.log("Chemin après 'upload':", fullPath);

		// Supprimer l'extension du fichier et les paramètres de transformation
		let publicId = fullPath;

		// Supprimer les paramètres de transformation (ex: /w_300,h_200,c_fill)
		// Chercher le dernier slash qui sépare les transformations du nom de fichier
		const lastSlashIndex = publicId.lastIndexOf("/");
		if (lastSlashIndex !== -1) {
			const beforeLastSlash = publicId.substring(0, lastSlashIndex);
			const afterLastSlash = publicId.substring(lastSlashIndex + 1);

			// Si après le dernier slash il y a des paramètres (pas d'extension), on les supprime
			if (!afterLastSlash.includes(".")) {
				publicId = beforeLastSlash;
			} else {
				// Sinon on garde tout et on supprime juste l'extension
				publicId = publicId.replace(/\.[^/.]+$/, "");
			}
		}

		// Supprimer le préfixe de version si présent (ex: v1234567890/)
		publicId = publicId.replace(/^v\d+\//, "");

		console.log("ID public extrait:", publicId);
		return publicId;
	} catch (error) {
		console.error("Erreur lors de l'extraction de l'ID public:", error);
		return null;
	}
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
