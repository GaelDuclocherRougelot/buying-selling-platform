import { auth } from "@/lib/auth";
import { getConnectionInfo } from "@/lib/login-logger";
import { LoginLogService } from "@/services/login-log";
import { NextRequest, NextResponse } from "next/server";

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
			ipAddress: clientIpAddress,
			userAgent: clientUserAgent,
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

		// Extraire les informations de connexion depuis les headers
		const { ipAddress, userAgent } = getConnectionInfo(request.headers);

		// Debug: Log available headers for IP detection
		console.log("🔍 IP Detection Debug:");
		console.log("x-forwarded-for:", request.headers.get("x-forwarded-for"));
		console.log("x-real-ip:", request.headers.get("x-real-ip"));
		console.log(
			"cf-connecting-ip:",
			request.headers.get("cf-connecting-ip")
		);
		console.log("x-client-ip:", request.headers.get("x-client-ip"));
		console.log("x-forwarded:", request.headers.get("x-forwarded"));
		console.log("forwarded-for:", request.headers.get("forwarded-for"));
		console.log("forwarded:", request.headers.get("forwarded"));
		console.log("Extracted IP:", ipAddress);
		console.log("Extracted User-Agent:", userAgent);

		const logData = {
			userId: session.user.id,
			action,
			ipAddress: clientIpAddress || ipAddress, // Utiliser l'IP du client si fournie, sinon extraire des headers
			userAgent: clientUserAgent || userAgent, // Utiliser le User-Agent du client si fourni, sinon extraire des headers
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
