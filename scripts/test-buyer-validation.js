#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testBuyerValidation() {
	console.log("🧪 Test de la Validation Acheteur\n");

	try {
		// Trouver un paiement in-person en pending_shipping_validation
		const payment = await prisma.payment.findFirst({
			where: {
				status: "pending_shipping_validation",
				product: {
					delivery: "in-person",
				},
			},
			include: {
				product: true,
				buyer: true,
			},
		});

		if (!payment) {
			console.log("❌ Aucun paiement in-person en attente trouvé");
			return;
		}

		console.log("Paiement trouvé pour test:");
		console.log(`   ID: ${payment.id}`);
		console.log(`   Statut: ${payment.status}`);
		console.log(`   Produit: ${payment.product.title}`);
		console.log(`   Livraison: ${payment.product.delivery}`);
		console.log(
			`   Acheteur: ${payment.buyer.username || payment.buyer.id}`
		);
		console.log("");

		console.log(
			"✅ Ce paiement devrait maintenant pouvoir être validé par l'acheteur"
		);
		console.log('   via le bouton "Valider la transaction"');
		console.log("");
		console.log("📋 Pour tester:");
		console.log("   1. Connectez-vous en tant qu'acheteur");
		console.log("   2. Allez sur la page de validation");
		console.log('   3. Cliquez sur "Valider la transaction"');
		console.log('   4. Le statut devrait passer à "succeeded"');
	} catch (error) {
		console.error("❌ Erreur:", error);
	} finally {
		await prisma.$disconnect();
	}
}

if (require.main === module) {
	testBuyerValidation();
}

module.exports = { testBuyerValidation };
