// Configuration centralisée des frais de plateforme

export interface PlatformFeeConfig {
	percentage: number;
	minimumFee?: number; // En euros
	maximumFee?: number; // En euros
	category?: string;
}

// Configuration par défaut
export const DEFAULT_PLATFORM_FEE = 0.05; // 5%

// Configuration par catégorie (optionnel)
export const CATEGORY_FEES: Record<string, number> = {
	electronics: 0.04, // 4% pour l'électronique
	fashion: 0.05, // 5% pour la mode
	collectibles: 0.06, // 6% pour les objets de collection
	default: 0.05, // 5% par défaut
};

// 🎯 Configuration par volume vendeur (système progressif)
export const VOLUME_DISCOUNTS = [
	{ minSales: 0, maxSales: 9, feePercentage: 0.05 }, // 5% pour 0-9 ventes
	{ minSales: 10, maxSales: 49, feePercentage: 0.04 }, // 4% pour 10-49 ventes
	{ minSales: 50, maxSales: 999, feePercentage: 0.03 }, // 3% pour 50+ ventes
];

/**
 * Calculate platform fee based on amount and optional parameters
 */
export function calculatePlatformFee(
	amount: number,
	options?: {
		category?: string;
		sellerSalesCount?: number;
		customPercentage?: number;
	}
): {
	feeAmount: number;
	feePercentage: number;
	breakdown: string;
} {
	let feePercentage = DEFAULT_PLATFORM_FEE;
	let breakdown = `Frais standard (${DEFAULT_PLATFORM_FEE * 100}%)`;

	// 1. Override personnalisé
	if (options?.customPercentage) {
		feePercentage = options.customPercentage;
		breakdown = `Frais personnalisés (${feePercentage * 100}%)`;
	}
	// 2. 🎯 PRIORITÉ : Remise volume vendeur (le plus important)
	else if (options?.sellerSalesCount !== undefined) {
		const volumeDiscount = VOLUME_DISCOUNTS.find(
			(discount) =>
				options.sellerSalesCount! >= discount.minSales &&
				options.sellerSalesCount! <= discount.maxSales
		);

		if (volumeDiscount) {
			feePercentage = volumeDiscount.feePercentage;
			breakdown = `Remise volume ${options.sellerSalesCount} ventes (${feePercentage * 100}%)`;
		}
	}
	// 3. Frais par catégorie (si pas de remise volume)
	else if (options?.category && CATEGORY_FEES[options.category]) {
		feePercentage = CATEGORY_FEES[options.category];
		breakdown = `Frais catégorie ${options.category} (${feePercentage * 100}%)`;
	}

	const feeAmount = amount * feePercentage;

	return {
		feeAmount: Math.round(feeAmount * 100) / 100, // Arrondi à 2 décimales
		feePercentage,
		breakdown,
	};
}

/**
 * Get seller's total successful sales count
 */
export async function getSellerSalesCount(sellerId: string): Promise<number> {
	const { prisma } = await import("@/lib/prisma");

	const salesCount = await prisma.payment.count({
		where: {
			sellerId: sellerId,
			status: "succeeded",
		},
	});

	return salesCount;
}

/**
 * Format fee for display
 */
export function formatPlatformFee(
	feeAmount: number,
	feePercentage: number
): string {
	return `${feeAmount.toFixed(2)}€ (${feePercentage * 100}%)`;
}

/**
 * Get platform fee in cents for Stripe
 */
export function getPlatformFeeInCents(
	amount: number,
	options?: {
		category?: string;
		sellerSalesCount?: number;
		customPercentage?: number;
	}
): number {
	const { feeAmount } = calculatePlatformFee(amount, options);
	return Math.round(feeAmount * 100);
}

/**
 * Get next volume discount tier info for seller motivation
 */
export function getNextVolumeTier(currentSalesCount: number): {
	nextTier?: { minSales: number; feePercentage: number };
	salesNeeded?: number;
	currentTier: { minSales: number; maxSales: number; feePercentage: number };
} | null {
	const currentTier = VOLUME_DISCOUNTS.find(
		(tier) =>
			currentSalesCount >= tier.minSales &&
			currentSalesCount <= tier.maxSales
	);

	if (!currentTier) return null;

	const nextTier = VOLUME_DISCOUNTS.find(
		(tier) => tier.minSales > currentSalesCount
	);

	return {
		currentTier,
		nextTier,
		salesNeeded: nextTier
			? nextTier.minSales - currentSalesCount
			: undefined,
	};
}

