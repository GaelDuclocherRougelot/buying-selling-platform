import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { securityLog } from "@/lib/security-log";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const respondSchema = z.object({
	response: z.enum(["accepted", "rejected"]),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ offerId: string }> }
) {
	try {
		const user = await getUser();
		if (!user?.id) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		const { offerId } = await params;
		const parsed = respondSchema.safeParse(
			await request.json().catch(() => null)
		);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Réponse invalide" },
				{ status: 400 }
			);
		}
		const { response } = parsed.data;

		// Récupérer l'offre avec la conversation et le produit
		const offer = await prisma.offer.findUnique({
			where: { id: offerId },
			include: {
				conversation: {
					include: {
						product: true,
						buyer: true,
						seller: true,
					},
				},
				message: true,
			},
		});

		if (!offer) {
			return NextResponse.json(
				{ error: "Offre non trouvée" },
				{ status: 404 }
			);
		}

		// Seul le vendeur du produit peut répondre à une offre
		if (offer.conversation.product.ownerId !== user.id) {
			await securityLog("authz.denied", request.headers, {
				path: request.nextUrl.pathname,
				method: request.method,
				userId: user.id,
				offerId,
			});
			return NextResponse.json(
				{ error: "Seul le vendeur peut répondre à cette offre" },
				{ status: 403 }
			);
		}

		// Vérifier que l'offre n'est pas déjà traitée
		if (offer.status !== "pending") {
			return NextResponse.json(
				{ error: "Cette offre a déjà été traitée" },
				{ status: 400 }
			);
		}

		// Un produit déjà réservé ou vendu ne peut pas accepter une autre offre
		if (
			response === "accepted" &&
			offer.conversation.product.status !== "active"
		) {
			return NextResponse.json(
				{ error: "Ce produit n'est plus disponible" },
				{ status: 400 }
			);
		}

		// Mettre à jour le statut de l'offre
		await prisma.offer.update({
			where: { id: offerId },
			data: { status: response },
		});

		// Réserver le produit uniquement si l'offre est acceptée ;
		// un refus le laisse "active"
		if (response === "accepted") {
			await prisma.product.update({
				where: { id: offer.conversation.productId },
				data: { status: "waiting_payment" },
			});
		}

		return NextResponse.json({
			success: true,
			response,
		});
	} catch (error) {
		console.error("Erreur lors de la réponse à l&apos;offre:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}
