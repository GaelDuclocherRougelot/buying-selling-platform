#!/usr/bin/env node

/**
 * 🧪 Test du Flow de Paiement Corrigé
 *
 * Ce script teste que le statut du paiement reste en "pending_shipping_validation"
 * au lieu de passer automatiquement à "succeeded"
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testPaymentFlow() {
	console.log("🧪 Test du Flow de Paiement Corrigé\n");

	try {
		// 1. Vérifier les paiements existants
		console.log("📊 1. Vérification des paiements existants...");
		const payments = await prisma.payment.findMany({
			include: {
				product: true,
				buyer: true,
				seller: true,
			},
			orderBy: { createdAt: "desc" },
			take: 5,
		});

		console.log(`   Trouvé ${payments.length} paiements récents:\n`);

		payments.forEach((payment, index) => {
			console.log(`   ${index + 1}. Paiement ${payment.id}`);
			console.log(`      Statut: ${payment.status}`);
			console.log(`      Montant: ${payment.amount}€`);
			console.log(
				`      Commission: ${payment.applicationFeeAmount || 0}€`
			);
			console.log(`      Produit: ${payment.product.title}`);
			console.log(`      Livraison: ${payment.product.delivery}`);
			console.log(`      Créé: ${payment.createdAt.toISOString()}`);
			console.log(`      Mis à jour: ${payment.updatedAt.toISOString()}`);
			console.log("");
		});

		// 2. Vérifier les produits en attente de validation
		console.log(
			"📦 2. Vérification des produits en attente de validation..."
		);
		const pendingProducts = await prisma.product.findMany({
			where: {
				status: {
					in: [
						"pending_shipping_validation",
						"pending_buyer_validation",
					],
				},
			},
			include: {
				payments: {
					include: {
						buyer: true,
						seller: true,
					},
				},
			},
		});

		console.log(
			`   Trouvé ${pendingProducts.length} produits en attente de validation:\n`
		);

		pendingProducts.forEach((product, index) => {
			console.log(`   ${index + 1}. Produit ${product.id}`);
			console.log(`      Titre: ${product.title}`);
			console.log(`      Statut: ${product.status}`);
			console.log(`      Livraison: ${product.delivery}`);
			console.log(
				`      Paiement: ${product.payments[0]?.status || "Aucun"}`
			);
			console.log(
				`      Acheteur: ${product.payments[0]?.buyer.displayUsername || product.payments[0]?.buyer.username || "N/A"}`
			);
			console.log(
				`      Vendeur: ${product.payments[0]?.seller.displayUsername || product.payments[0]?.seller.username || "N/A"}`
			);
			console.log("");
		});

		// 3. Vérifier les preuves d'expédition
		console.log("📋 3. Vérification des preuves d'expédition...");
		const shippingProofs = await prisma.shippingProof.findMany({
			include: {
				payment: {
					include: {
						product: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
			take: 5,
		});

		console.log(
			`   Trouvé ${shippingProofs.length} preuves d'expédition récentes:\n`
		);

		shippingProofs.forEach((proof, index) => {
			console.log(`   ${index + 1}. Preuve ${proof.id}`);
			console.log(`      Statut: ${proof.status}`);
			console.log(`      Type: ${proof.proofType}`);
			console.log(`      Paiement: ${proof.payment.status}`);
			console.log(`      Produit: ${proof.payment.product.title}`);
			console.log(`      Soumise: ${proof.submittedAt.toISOString()}`);
			if (proof.verifiedAt) {
				console.log(`      Validée: ${proof.verifiedAt.toISOString()}`);
			}
			console.log("");
		});

		// 4. Résumé des statuts
		console.log("📈 4. Résumé des statuts de paiement...");
		const statusCounts = await prisma.payment.groupBy({
			by: ["status"],
			_count: {
				status: true,
			},
		});

		console.log("   Répartition des statuts:\n");
		statusCounts.forEach((status) => {
			console.log(
				`      ${status.status}: ${status._count.status} paiements`
			);
		});

		console.log("\n✅ Test terminé avec succès !");

		// 5. Vérifications de sécurité
		console.log("\n🔒 5. Vérifications de sécurité...");

		// Vérifier qu'aucun paiement n'est passé à "succeeded" sans validation
		const suspiciousPayments = await prisma.payment.findMany({
			where: {
				status: "succeeded",
				updatedAt: {
					gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
				},
			},
			include: {
				shippingProof: true,
			},
		});

		const unvalidatedPayments = suspiciousPayments.filter(
			(payment) =>
				!payment.shippingProof ||
				payment.shippingProof.status !== "verified"
		);

		if (unvalidatedPayments.length > 0) {
			console.log(
				`   ⚠️  ATTENTION: ${unvalidatedPayments.length} paiements suspects trouvés !`
			);
			unvalidatedPayments.forEach((payment) => {
				console.log(
					`      - Paiement ${payment.id} en statut "succeeded" sans preuve validée`
				);
			});
		} else {
			console.log("   ✅ Aucun paiement suspect trouvé");
		}
	} catch (error) {
		console.error("❌ Erreur lors du test:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// Exécuter le test
if (require.main === module) {
	testPaymentFlow();
}

module.exports = { testPaymentFlow };
