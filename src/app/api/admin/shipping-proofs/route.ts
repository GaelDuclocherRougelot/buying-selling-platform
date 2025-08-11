import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		// Récupérer toutes les preuves d'expédition avec les détails des paiements
		const proofs = await prisma.shippingProof.findMany({
			include: {
				payment: {
					include: {
						product: {
							select: {
								id: true,
								title: true,
								price: true,
							},
						},
						buyer: {
							select: {
								id: true,
								username: true,
								displayUsername: true,
							},
						},
						seller: {
							select: {
								id: true,
								username: true,
								displayUsername: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Transformer les données pour l'interface
		const formattedProofs = proofs.map((proof) => ({
			id: proof.id,
			status: proof.status,
			trackingNumber: (proof.proofData as { trackingNumber: string })
				.trackingNumber,
			carrier: (proof.proofData as { carrier: string }).carrier,
			packageImageUrl: (proof.proofData as { packageImageUrl: string })
				.packageImageUrl,
			receiptImageUrl: (proof.proofData as { receiptImageUrl: string })
				.receiptImageUrl,
			description: (proof.proofData as { description: string }).description,
			submittedAt: (proof.proofData as { submittedAt: string })
				.submittedAt,
			createdAt: proof.createdAt.toISOString(),
			payment: {
				id: proof.payment.id,
				amount: proof.payment.amount,
				status: proof.payment.status,
				product: {
					id: proof.payment.product.id,
					title: proof.payment.product.title,
					price: proof.payment.product.price,
				},
				buyer: {
					id: proof.payment.buyer.id,
					username:
						proof.payment.buyer.displayUsername ||
						proof.payment.buyer.username,
				},
				seller: {
					id: proof.payment.seller.id,
					username:
						proof.payment.seller.displayUsername ||
						proof.payment.seller.username,
				},
			},
		}));

		return NextResponse.json({
			proofs: formattedProofs,
			total: formattedProofs.length,
			pending: formattedProofs.filter((p) => p.status === "pending_verification")
				.length,
			verified: formattedProofs.filter((p) => p.status === "verified")
				.length,
			rejected: formattedProofs.filter((p) => p.status === "rejected")
				.length,
		});
	} catch (error) {
		console.error("Erreur lors de la récupération des preuves:", error);
		return NextResponse.json(
			{ error: "Erreur lors de la récupération des preuves" },
			{ status: 500 }
		);
	}
}
