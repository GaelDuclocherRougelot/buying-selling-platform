import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Nettoyer les IDs de compte Stripe invalides
		const cleanedUsers = await prisma.user.updateMany({
			where: {
				OR: [
					{
						stripeAccountId: {
							not: null,
						},
						NOT: {
							stripeAccountId: {
								startsWith: "acct_",
							},
						},
					},
					{
						stripeAccountId: "req_Z4n0SHdfUjq7mU", // ID spécifique qui pose problème
					},
				],
			},
			data: {
				stripeAccountId: null,
				stripeAccountStatus: null,
			},
		});

		console.log(
			`✅ Nettoyage terminé: ${cleanedUsers.count} utilisateurs mis à jour`
		);

		return NextResponse.json({
			message: "Cleanup completed",
			updatedCount: cleanedUsers.count,
		});
	} catch (error) {
		console.error("Error during cleanup:", error);
		return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
	}
}
