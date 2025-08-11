import { auth } from "@/lib/auth";
import {
	calculatePlatformFee,
	getNextVolumeTier,
	getSellerSalesCount,
} from "@/lib/platform-fees";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Non autorisé" },
				{ status: 401 }
			);
		}

		// Récupérer le nombre de ventes du vendeur
		const salesCount = await getSellerSalesCount(session.user.id);

		// Calculer les frais actuels (avec un montant exemple de 100€)
		const feeInfo = calculatePlatformFee(100, {
			sellerSalesCount: salesCount,
		});

		// Récupérer les informations sur le palier suivant
		const tierInfo = getNextVolumeTier(salesCount);

		return NextResponse.json({
			success: true,
			data: {
				currentSalesCount: salesCount,
				currentFeePercentage: feeInfo.feePercentage,
				breakdown: feeInfo.breakdown,
				nextTier: tierInfo?.nextTier,
				salesNeeded: tierInfo?.salesNeeded,
				currentTier: tierInfo?.currentTier,
			},
		});
	} catch (error) {
		console.error("Erreur récupération info commission:", error);
		return NextResponse.json(
			{ error: "Erreur interne du serveur" },
			{ status: 500 }
		);
	}
}

