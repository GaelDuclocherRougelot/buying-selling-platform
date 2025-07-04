import { getUser } from "@/lib/auth-session";
import cloudinary  from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	const user = await getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(req.url);
	const folderName = url.pathname.split("/").pop() || "default_uploads";
	const formData = await req.formData();
	const files = formData.getAll("files");

	if (!files.length) {
		return NextResponse.json(
			{ error: "Aucun fichier envoyé" },
			{ status: 400 }
		);
	}

	// Valider les fichiers (par exemple, taille max 10MB, formats acceptés)
	const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
	const maxSize = 10 * 1024 * 1024; // 10MB
	for (const file of files) {
		if (!(file instanceof File)) {
			return NextResponse.json(
				{ error: "Fichier invalide" },
				{ status: 400 }
			);
		}
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{ error: "Format de fichier non supporté" },
				{ status: 400 }
			);
		}
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "Fichier trop volumineux (max 10MB)" },
				{ status: 400 }
			);
		}
	}

	// Fonction utilitaire pour uploader un fichier
	const uploadToCloudinary = (file: File) =>
		new Promise((resolve, reject) => {
			file.arrayBuffer().then((arrayBuffer) => {
				const buffer = Buffer.from(arrayBuffer);
				const stream = cloudinary.uploader.upload_stream(
					{
						folder: folderName,
						public_id: user.id, // ID unique par user
						upload_preset:
							process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME,
					},
					(error, result) => {
						if (error) reject(error);
						else resolve(result);
					}
				);
				stream.end(buffer);
			});
		});

	try {
		const uploadResults = await Promise.all(
			files.map((file) => uploadToCloudinary(file as File))
		);
		const urls = uploadResults.map((result: any) => result.secure_url);

		return NextResponse.json({ urls });
	} catch (error: any) {
		console.error("Erreur lors de l'upload:", error);
		return NextResponse.json(
			{ error: error.message || "Échec de l'upload" },
			{ status: 500 }
		);
	}
}
