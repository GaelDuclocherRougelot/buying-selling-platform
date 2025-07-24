import { getUser } from "@/lib/auth-session";
import cloudinary from "@/lib/cloudinary";
import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(req);
	if (corsPreflightResponse) return corsPreflightResponse;

	const user = await getUser();

	if (!user) {
		return corsResponse({ error: "Unauthorized" }, 401);
	}

	const url = new URL(req.url);
	const folderName = url.pathname.split("/").pop() || "default_uploads";
	const formData = await req.formData();
	const files = formData.getAll("files");

	if (!files.length) {
		return corsResponse({ error: "Aucun fichier envoyé" }, 400);
	}

	// Valider les fichiers (par exemple, taille max 10MB, formats acceptés)
	const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
	const maxSize = 10 * 1024 * 1024; // 10MB
	for (const file of files) {
		if (!(file instanceof File)) {
			return corsResponse({ error: "Fichier invalide" }, 400);
		}
		if (!allowedTypes.includes(file.type)) {
			return corsResponse(
				{ error: "Format de fichier non supporté" },
				400
			);
		}
		if (file.size > maxSize) {
			return corsResponse(
				{ error: "Fichier trop volumineux (max 10MB)" },
				400
			);
		}
	}

	// Paramètres de l'upload vers l'API Cloudinary
	const payload: {
		folder: string;
		upload_preset?: string;
		public_id?: string;
	} = {
		folder: folderName,
		upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME,
	};

	// ajoute l'ID de l'utilisateur à la liste des paramètres de l'upload (si le dossier est "profile-pictures")
	if (folderName === "profile-pictures") {
		payload.public_id = user.id;
	}

	// Définir le type pour le résultat de l'upload Cloudinary
	type CloudinaryUploadResult = {
		secure_url: string;
		// Ajoutez d'autres propriétés si nécessaire
	};

	// Fonction utilitaire pour uploader un fichier
	const uploadToCloudinary = (file: File) =>
		new Promise<CloudinaryUploadResult>((resolve, reject) => {
			file.arrayBuffer().then((arrayBuffer) => {
				const buffer = Buffer.from(arrayBuffer);
				const stream = cloudinary.uploader.upload_stream(
					payload,
					(error, result) => {
						if (error) reject(error);
						else resolve(result as CloudinaryUploadResult);
					}
				);
				stream.end(buffer);
			});
		});

	try {
		// Upload plusieurs fichiers
		const uploadResults = await Promise.all(
			files.map((file) => uploadToCloudinary(file as File))
		);
		const urls = uploadResults.map((result) => result.secure_url);

		const response = NextResponse.json({ urls });
		return addCorsHeaders(response);
	} catch (error: unknown) {
		console.error("Erreur lors de l'upload:", error);
		const errorMessage =
			typeof error === "object" && error !== null && "message" in error
				? (error as { message?: string }).message
				: "Échec de l'upload";
		return corsResponse({ error: errorMessage }, 500);
	}
}
