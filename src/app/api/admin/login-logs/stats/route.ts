import { auth } from "@/lib/auth";
import { LoginLogService } from "@/services/login-log";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		// Vérifier que l'utilisateur est connecté et a les permissions admin
		if (!session?.user || session.user.role !== "admin") {
			return NextResponse.json(
				{ error: "Accès non autorisé" },
				{ status: 403 }
			);
		}

		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const days = parseInt(searchParams.get("days") || "30");

		const stats = await LoginLogService.getLoginStats(
			userId || undefined,
			days
		);

		return NextResponse.json({ stats });
	} catch (error) {
		console.error(
			"Erreur lors de la récupération des statistiques:",
			error
		);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
