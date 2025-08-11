#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkInPersonProducts() {
	console.log("🔍 Vérification des Produits In-Person\n");

	try {
		const inPersonProducts = await prisma.product.findMany({
			where: { delivery: "in-person" },
			include: { payments: true },
			orderBy: { createdAt: "desc" },
			take: 5,
		});

		console.log(
			`Trouvé ${inPersonProducts.length} produits avec livraison in-person:\n`
		);

		inPersonProducts.forEach((product, index) => {
			console.log(`${index + 1}. Produit: ${product.title}`);
			console.log(`   ID: ${product.id}`);
			console.log(`   Statut: ${product.status}`);
			console.log(`   Livraison: ${product.delivery}`);
			console.log(`   Paiements: ${product.payments.length}`);

			product.payments.forEach((payment) => {
				console.log(
					`      - Paiement ${payment.id}: ${payment.status}`
				);
			});
			console.log("");
		});
	} catch (error) {
		console.error("❌ Erreur:", error);
	} finally {
		await prisma.$disconnect();
	}
}

if (require.main === module) {
	checkInPersonProducts();
}

module.exports = { checkInPersonProducts };

