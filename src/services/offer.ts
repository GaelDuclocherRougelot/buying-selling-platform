import { prisma } from "@/lib/prisma";

/**
 * Récupère une offre par son messageId
 */
export async function getOfferByMessageId(messageId: string) {
	return await prisma.offer.findUnique({
		where: {
			messageId: messageId,
		}
	});
}
