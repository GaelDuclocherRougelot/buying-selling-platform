import { prisma } from "@/lib/prisma";

/** Délai laissé à l'acheteur pour payer après l'acceptation de son offre */
export const RESERVATION_DURATION_MS = 48 * 60 * 60 * 1000;

/**
 * Libère les réservations expirées : les offres acceptées depuis plus de
 * RESERVATION_DURATION_MS et jamais payées passent en "expired", et leur
 * produit repasse en "active".
 *
 * @param productId - limite la vérification à un produit (sinon tous)
 * @returns le nombre de produits repassés en "active"
 */
export async function releaseExpiredReservations(
	productId?: string
): Promise<number> {
	const expiredOffers = await prisma.offer.findMany({
		where: {
			status: "accepted",
			updatedAt: { lt: new Date(Date.now() - RESERVATION_DURATION_MS) },
			conversation: {
				product: {
					...(productId ? { id: productId } : {}),
					status: "waiting_payment",
					// Un paiement en cours ou abouti garde le produit réservé
					payments: {
						none: {
							status: {
								in: [
									"pending",
									"pending_shipping_validation",
									"pending_buyer_validation",
									"succeeded",
								],
							},
						},
					},
				},
			},
		},
		select: { id: true, conversation: { select: { productId: true } } },
	});

	if (expiredOffers.length === 0) return 0;

	await prisma.offer.updateMany({
		where: { id: { in: expiredOffers.map((offer) => offer.id) } },
		data: { status: "expired" },
	});

	// Le produit reste réservé s'il a une autre offre acceptée encore valide
	const { count } = await prisma.product.updateMany({
		where: {
			id: { in: expiredOffers.map((offer) => offer.conversation.productId) },
			status: "waiting_payment",
			conversations: {
				none: { offers: { some: { status: "accepted" } } },
			},
		},
		data: { status: "active" },
	});

	return count;
}
