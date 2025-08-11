#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixInPersonPayment() {
	console.log("🔧 Correction du Paiement In-Person\n");

	try {
		// Trouver le paiement problématique
		const payment = await prisma.payment.findUnique({
			where: { id: "cme73avv0000fkal87ed7s6ci" },
			include: { product: true },
		});

		if (!payment) {
			console.log("❌ Paiement non trouvé");
			return;
		}

		console.log("Paiement trouvé:");
		console.log(`   ID: ${payment.id}`);
		console.log(`   Statut actuel: ${payment.status}`);
		console.log(`   Produit: ${payment.product.title}`);
		console.log(`   Livraison: ${payment.product.delivery}`);
		console.log(`   Créé: ${payment.createdAt.toISOString()}`);
		console.log(`   Mis à jour: ${payment.updatedAt.toISOString()}`);

		if (
			payment.product.delivery === "in-person" &&
			payment.status === "succeeded"
		) {
			console.log("\n🔧 Correction nécessaire...");

			// Corriger le statut du paiement
			await prisma.payment.update({
				where: { id: payment.id },
				data: {
					status: "pending_buyer_validation",
					updatedAt: new Date(),
				},
			});

			// Corriger le statut du produit
			await prisma.product.update({
				where: { id: payment.productId },
				data: {
					status: "pending_buyer_validation",
				},
			});

			console.log("✅ Paiement corrigé: pending_buyer_validation");
			console.log("✅ Produit corrigé: pending_buyer_validation");
		} else {
			console.log("✅ Aucune correction nécessaire");
		}
	} catch (error) {
		console.error("❌ Erreur:", error);
	} finally {
		await prisma.$disconnect();
	}
}

if (require.main === module) {
	fixInPersonPayment();
}

module.exports = { fixInPersonPayment };

