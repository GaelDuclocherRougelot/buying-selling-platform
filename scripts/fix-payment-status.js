#!/usr/bin/env node

/**
 * 🔧 Correction Automatique des Statuts de Paiement
 *
 * Ce script corrige les paiements qui ont été incorrectement mis à "succeeded"
 * au lieu de rester en "pending_shipping_validation"
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixPaymentStatus() {
	console.log("🔧 Correction Automatique des Statuts de Paiement\n");

	try {
		// 1. Identifier les paiements suspects
		console.log("🔍 1. Identification des paiements suspects...");

		const suspiciousPayments = await prisma.payment.findMany({
			where: {
				status: "succeeded",
				updatedAt: {
					gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Dernière semaine
				},
			},
			include: {
				product: true,
				shippingProof: true,
				buyer: true,
				seller: true,
			},
		});

		console.log(
			`   Trouvé ${suspiciousPayments.length} paiements suspects:\n`
		);

		suspiciousPayments.forEach((payment, index) => {
			console.log(`   ${index + 1}. Paiement ${payment.id}`);
			console.log(`      Stripe ID: ${payment.stripePaymentIntentId}`);
			console.log(`      Montant: ${payment.amount}€`);
			console.log(`      Produit: ${payment.product.title}`);
			console.log(`      Livraison: ${payment.product.delivery}`);
			console.log(
				`      Acheteur: ${payment.buyer.displayUsername || payment.buyer.username || "N/A"}`
			);
			console.log(
				`      Vendeur: ${payment.seller.displayUsername || payment.seller.username || "N/A"}`
			);
			console.log(
				`      Preuve d'expédition: ${payment.shippingProof ? payment.shippingProof.status : "Aucune"}`
			);
			console.log(`      Mis à jour: ${payment.updatedAt.toISOString()}`);
			console.log("");
		});

		if (suspiciousPayments.length === 0) {
			console.log("   ✅ Aucun paiement suspect trouvé !");
			return;
		}

		// 2. Analyser chaque paiement
		console.log("📊 2. Analyse des paiements suspects...\n");

		const paymentsToFix = [];
		const paymentsToKeep = [];

		for (const payment of suspiciousPayments) {
			const shouldFix = await analyzePayment(payment);

			if (shouldFix) {
				paymentsToFix.push(payment);
			} else {
				paymentsToKeep.push(payment);
			}
		}

		console.log(`   Paiements à corriger: ${paymentsToFix.length}`);
		console.log(`   Paiements à conserver: ${paymentsToKeep.length}\n`);

		// 3. Corriger les paiements
		if (paymentsToFix.length > 0) {
			console.log("🔧 3. Correction des paiements...\n");

			for (const payment of paymentsToFix) {
				await fixPayment(payment);
			}
		}

		// 4. Résumé des corrections
		console.log("📈 4. Résumé des corrections...\n");

		if (paymentsToFix.length > 0) {
			console.log("   ✅ Paiements corrigés:");
			paymentsToFix.forEach((payment) => {
				console.log(`      - ${payment.id}: ${payment.product.title}`);
			});
		}

		if (paymentsToKeep.length > 0) {
			console.log("\n   ℹ️  Paiements conservés (déjà corrects):");
			paymentsToKeep.forEach((payment) => {
				console.log(
					`      - ${payment.id}: ${payment.product.title} (${payment.shippingProof?.status || "Aucune preuve"})`
				);
			});
		}

		console.log("\n✅ Correction terminée avec succès !");
	} catch (error) {
		console.error("❌ Erreur lors de la correction:", error);
	} finally {
		await prisma.$disconnect();
	}
}

async function analyzePayment(payment) {
	// Un paiement doit être corrigé si :
	// 1. Il n'a pas de preuve d'expédition validée
	// 2. Il n'est pas en livraison "in-person" (qui nécessite validation acheteur)

	const hasValidProof =
		payment.shippingProof && payment.shippingProof.status === "verified";
	const isInPersonDelivery = payment.product.delivery === "in-person";

	if (hasValidProof) {
		console.log(
			`   ✅ Paiement ${payment.id}: Preuve validée, statut correct`
		);
		return false;
	}

	if (isInPersonDelivery) {
		console.log(
			`   ✅ Paiement ${payment.id}: Livraison in-person, statut correct`
		);
		return false;
	}

	console.log(
		`   ❌ Paiement ${payment.id}: Doit être corrigé (pas de preuve validée)`
	);
	return true;
}

async function fixPayment(payment) {
	try {
		// Déterminer le bon statut selon le type de livraison
		let correctStatus = "pending_shipping_validation";
		if (payment.product.delivery === "in-person") {
			correctStatus = "pending_buyer_validation";
		}

		// Corriger le statut du paiement
		await prisma.payment.update({
			where: { id: payment.id },
			data: {
				status: correctStatus,
				updatedAt: new Date(),
			},
		});

		// Corriger le statut du produit
		await prisma.product.update({
			where: { id: payment.productId },
			data: {
				status: correctStatus,
			},
		});

		console.log(
			`      ✅ Paiement ${payment.id} corrigé: ${correctStatus}`
		);
	} catch (error) {
		console.error(
			`      ❌ Erreur lors de la correction du paiement ${payment.id}:`,
			error
		);
	}
}

// Exécuter la correction
if (require.main === module) {
	fixPaymentStatus();
}

module.exports = { fixPaymentStatus };

