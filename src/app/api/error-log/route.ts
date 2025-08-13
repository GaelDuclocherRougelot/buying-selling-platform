import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const errorData = await request.json();

		// Validation basique des données d'erreur
		if (!errorData.message || !errorData.timestamp) {
			return NextResponse.json(
				{ error: "Données d'erreur invalides" },
				{ status: 400 }
			);
		}

		// Extraire les informations de l'utilisateur si disponible
		const userId = errorData.userId || null;
		const userAgent = request.headers.get("user-agent") || null;
		const ip =
			request.headers.get("x-forwarded-for") ||
			request.headers.get("x-real-ip") ||
			"unknown";

		try {
			// Logger l'erreur dans la base de données
			await prisma.errorLog.create({
				data: {
					message: errorData.message,
					code: errorData.code,
					status: errorData.status,
					path: errorData.path,
					userId,
					userAgent,
					ip,
					details: errorData.details ? errorData.details : null,
					timestamp: new Date(errorData.timestamp),
				},
			});

			console.log("✅ Erreur loggée avec succès dans la base de données");
		} catch (dbError) {
			console.error("❌ Erreur lors de l'insertion en base:", dbError);

			// Fallback: logger dans la console si la base échoue
			console.error("🚨 Error logged from client (fallback):", {
				message: errorData.message,
				code: errorData.code,
				status: errorData.status,
				path: errorData.path,
				userId,
				userAgent,
				ip,
				timestamp: errorData.timestamp,
				details: errorData.details,
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Erreur lors du logging de l'erreur:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		// Récupérer les logs d'erreur depuis la base de données
		const errorLogs = await prisma.errorLog.findMany({
			orderBy: { createdAt: "desc" },
			take: 100, // Limiter à 100 erreurs les plus récentes
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
					},
				},
			},
		});

		return NextResponse.json({
			success: true,
			data: errorLogs,
			count: errorLogs.length,
		});
	} catch (error) {
		console.error("Erreur lors de la récupération des logs:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (id) {
			// Supprimer une erreur spécifique
			await prisma.errorLog.delete({
				where: { id },
			});
			return NextResponse.json({
				success: true,
				message: "Erreur supprimée",
			});
		} else {
			// Supprimer toutes les erreurs (optionnel: ajouter une authentification admin)
			const deleteCount = await prisma.errorLog.deleteMany({});
			return NextResponse.json({
				success: true,
				message: `${deleteCount.count} erreurs supprimées`,
			});
		}
	} catch (error) {
		console.error("Erreur lors de la suppression des logs:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
