import { auth } from "@/lib/auth";
import { LoginLogService } from "@/services/login-log";
import type { LoginAction } from "@/types/login-log";
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
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		// Vérifier que l'utilisateur est connecté
		if (!session?.user) {
			return NextResponse.json(
				{ error: "Non authentifié" },
				{ status: 401 }
			);
		}

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
			userId: session.user.id,
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
