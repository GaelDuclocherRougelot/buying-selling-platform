import {
	createAuthErrorResponse,
	createNotFoundErrorResponse,
	handleApiRoute,
} from "@/lib/api-error-handler";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	return handleApiRoute(async () => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return createAuthErrorResponse("Non autorisé");
		}

		// Récupérer toutes les données de l'utilisateur
		const userData = await prisma.user.findUnique({
			where: { id: session.user.id },
			include: {
				products: {
					select: {
						id: true,
						title: true,
						description: true,
						price: true,
						status: true,
						createdAt: true,
						updatedAt: true,
					},
				},
				PaymentBuyer: {
					select: {
						id: true,
						amount: true,
						currency: true,
						status: true,
						createdAt: true,
					},
				},
				PaymentSeller: {
					select: {
						id: true,
						amount: true,
						currency: true,
						status: true,
						createdAt: true,
					},
				},
				favorites: {
					select: {
						id: true,
						createdAt: true,
					},
				},
				loginLogs: {
					select: {
						id: true,
						action: true,
						ipAddress: true,
						userAgent: true,
						location: true,
						success: true,
						failureReason: true,
						createdAt: true,
					},
				},
			},
		});

		if (!userData) {
			return createNotFoundErrorResponse("Utilisateur non trouvé");
		}

		// Préparer les données pour l'export
		const exportData = {
			exportDate: new Date().toISOString(),
			user: {
				id: userData.id,
				name: userData.name,
				email: userData.email,
				username: userData.username,
				displayUsername: userData.displayUsername,
				emailVerified: userData.emailVerified,
				role: userData.role,
				createdAt: userData.createdAt,
				updatedAt: userData.updatedAt,
			},
			products: userData.products,
			paymentsAsBuyer: userData.PaymentBuyer,
			paymentsAsSeller: userData.PaymentSeller,
			favorites: userData.favorites,
			loginLogs: userData.loginLogs,
		};

		// Retourner les données en JSON
		return NextResponse.json({
			data: exportData,
		});
	});
}
