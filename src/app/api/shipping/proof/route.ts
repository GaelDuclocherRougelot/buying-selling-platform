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
				{ error: "Non authentifié" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { paymentId, proofType, proofData } = body;

		// Vérifier que le paiement existe et que l'utilisateur est le vendeur
		const payment = await prisma.payment.findUnique({
			where: { id: paymentId },
			include: {
				product: true,
				seller: true,
				buyer: true,
			},
		});

		if (!payment) {
			return NextResponse.json(
				{ error: "Paiement non trouvé" },
				{ status: 404 }
			);
		}

		if (payment.sellerId !== session.user.id) {
			return NextResponse.json(
				{
					error: "Seul le vendeur peut fournir une preuve d'expédition",
				},
				{ status: 403 }
			);
		}

		// Créer ou mettre à jour la preuve d'expédition
		const shippingProof = await prisma.shippingProof.upsert({
			where: { paymentId },
			update: {
				proofType,
				proofData,
				submittedAt: new Date(),
				status: "pending_verification",
			},
			create: {
				paymentId,
				proofType,
				proofData,
				status: "pending_verification",
			},
		});

		return NextResponse.json({
			proof: shippingProof,
			message: "Preuve d'expédition soumise avec succès",
		});
	} catch (error) {
		console.error("❌ Erreur preuve d'expédition:", error);
		return NextResponse.json(
			{ error: "Erreur lors de la soumission de la preuve" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Non authentifié" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const paymentId = searchParams.get("paymentId");

		if (!paymentId) {
			return NextResponse.json(
				{ error: "paymentId requis" },
				{ status: 400 }
			);
		}

		// Récupérer la preuve d'expédition
		const shippingProof = await prisma.shippingProof.findUnique({
			where: { paymentId },
			include: {
				payment: {
					include: {
						product: true,
						seller: true,
						buyer: true,
					},
				},
			},
		});

		if (!shippingProof) {
			return NextResponse.json(
				{ error: "Preuve d'expédition non trouvée" },
				{ status: 404 }
			);
		}

		// Vérifier que l'utilisateur est l'acheteur ou le vendeur
		if (
			shippingProof.payment.buyerId !== session.user.id &&
			shippingProof.payment.sellerId !== session.user.id
		) {
			return NextResponse.json(
				{ error: "Accès non autorisé" },
				{ status: 403 }
			);
		}

		return NextResponse.json({
			proof: shippingProof,
		});
	} catch (error) {
		console.error("❌ Erreur récupération preuve:", error);
		return NextResponse.json(
			{ error: "Erreur lors de la récupération de la preuve" },
			{ status: 500 }
		);
	}
}
