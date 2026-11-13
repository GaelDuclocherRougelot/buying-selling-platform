import { createRateLimitErrorResponse } from "@/lib/api-error-handler";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-guards";
import { getConnectionInfo } from "@/lib/login-logger";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Erreurs remontées par le client (src/lib/error-handler.ts) : route publique,
// donc forme, taille et débit bornés. Les clés inconnues (dont userId) sont ignorées.
const errorLogSchema = z.object({
	message: z.string().min(1).max(2000),
	code: z.string().max(100).optional(),
	status: z.number().int().optional(),
	path: z.string().max(2000).optional(),
	stack: z.string().max(10000).optional(),
	details: z
		.unknown()
		.refine((d) => d === undefined || JSON.stringify(d).length <= 10000, {
			message: "details trop volumineux",
		}),
	timestamp: z.coerce.date(),
});

export async function POST(request: NextRequest) {
	try {
		const { ipAddress: ip, userAgent } = getConnectionInfo(request.headers);
		if (!rateLimit(`error-log:${ip}`, 20, 60_000)) {
			return createRateLimitErrorResponse();
		}
		if (Number(request.headers.get("content-length")) > 32_000) {
			return NextResponse.json(
				{ error: "Données d'erreur trop volumineuses" },
				{ status: 413 }
			);
		}

		const parsed = errorLogSchema.safeParse(
			await request.json().catch(() => null)
		);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Données d'erreur invalides" },
				{ status: 400 }
			);
		}
		const errorData = parsed.data;

		// userId depuis la session uniquement, jamais depuis le corps
		const session = await auth.api.getSession({ headers: request.headers });
		const userId = session?.user?.id ?? null;
		const details =
			errorData.stack !== undefined
				? { stack: errorData.stack, details: errorData.details ?? null }
				: errorData.details ?? null;

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
					details:
						details === null
							? Prisma.JsonNull
							: (details as Prisma.InputJsonValue),
					timestamp: errorData.timestamp,
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
				details,
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

export async function GET(request: NextRequest) {
	const admin = await requireAdmin(request);
	if (admin instanceof NextResponse) return admin;
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
	const admin = await requireAdmin(request);
	if (admin instanceof NextResponse) return admin;
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
			// Supprimer toutes les erreurs
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
