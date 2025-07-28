import { cleanupLoginLogs } from "@/services/cron";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		// Vérifier le secret pour sécuriser l'endpoint
		const authHeader = request.headers.get("authorization");
		const expectedSecret = process.env.CRON_SECRET;

		if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		const result = await cleanupLoginLogs();

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: result.message,
				deletedCount: result.deletedCount,
				timestamp: new Date().toISOString(),
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: result.error,
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Erreur lors du nettoyage des logs:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Erreur interne du serveur",
			},
			{ status: 500 }
		);
	}
}
