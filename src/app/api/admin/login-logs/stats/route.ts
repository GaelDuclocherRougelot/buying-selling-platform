import { requireAdmin } from "@/lib/auth-guards";
import { LoginLogService } from "@/services/login-log";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	// 401 sans session, 403 si non admin (journalisés pour le SIEM)
	const admin = await requireAdmin(request);
	if (admin instanceof NextResponse) return admin;
	try {
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
