import { requireAdmin } from "@/lib/auth-guards";
import { LoginLogService } from "@/services/login-log";
import type { LoginAction } from "@/types/login-log";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	// 401 sans session, 403 si non admin (journalisés pour le SIEM)
	const admin = await requireAdmin(request);
	if (admin instanceof NextResponse) return admin;
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const action = searchParams.get("action") as LoginAction | null;
		const success = searchParams.get("success");
		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = parseInt(searchParams.get("offset") || "0");

		const filters = {
			userId: userId || undefined,
			action: action || undefined,
			success: success ? success === "true" : undefined,
			limit,
			offset,
		};

		const logs = await LoginLogService.findMany(filters);

		return NextResponse.json({ logs });
	} catch (error) {
		console.error("Erreur lors de la récupération des logs:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	// Journal d'audit admin : écriture réservée aux admins
	const admin = await requireAdmin(request);
	if (admin instanceof NextResponse) return admin;
	try {
		const body = await request.json();
		const {
			action,
			ipAddress,
			userAgent,
			location,
			success,
			failureReason,
		} = body;

		// Validation des données
		if (!action) {
			return NextResponse.json(
				{ error: "L'action est requise" },
				{ status: 400 }
			);
		}

		const logData = {
			userId: admin.id,
			action,
			ipAddress,
			userAgent,
			location,
			success: success ?? true,
			failureReason,
		};

		const log = await LoginLogService.create(logData);

		return NextResponse.json({ log }, { status: 201 });
	} catch (error) {
		console.error("Erreur lors de la création du log:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
