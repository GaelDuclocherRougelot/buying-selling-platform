require("dotenv").config();
const Stripe = require("stripe");
const { PrismaClient } = require("@prisma/client");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

async function testPaymentFlow() {
	console.log("🧪 Test du flux de paiement complet...\n");

	try {
		// 1. Vérifier la configuration
		console.log("📋 Configuration:");
		console.log(
			"- STRIPE_SECRET_KEY:",
			process.env.STRIPE_SECRET_KEY ? "✅" : "❌"
		);
		console.log(
			"- STRIPE_WEBHOOK_SECRET:",
			process.env.STRIPE_WEBHOOK_SECRET ? "✅" : "❌"
		);

		// 2. Créer un produit de test
		console.log("\n🏷️ Création d'un produit de test...");
		const testProduct = await prisma.product.create({
			data: {
				title: "Produit de test",
				description: "Produit pour tester le paiement",
				price: 10.0,
				status: "active",
				ownerId: "test-seller-id", // Utilisez un vrai ID d'utilisateur
				categoryId: "test-category-id", // Utilisez un vrai ID de catégorie
			},
		});
		console.log("✅ Produit créé:", testProduct.id);

		// 3. Créer une session de checkout
		console.log("\n🛒 Création d'une session de checkout...");
		const checkoutSession = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "eur",
						product_data: {
							name: "Produit de test",
							description: "Test de paiement",
						},
						unit_amount: 1000, // 10€ en centimes
					},
					quantity: 1,
				},
			],
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile?payment=cancelled`,
			metadata: {
				productId: testProduct.id,
				buyerId: "test-buyer-id",
				sellerId: "test-seller-id",
			},
			payment_intent_data: {
				capture_method: "manual",
				application_fee_amount: 50, // 0.50€ de frais
				transfer_data: {
					destination: "acct_test_seller", // Utilisez un vrai Stripe Account ID
				},
			},
		});

		console.log("✅ Session créée:", checkoutSession.id);
		console.log("- Payment Intent:", checkoutSession.payment_intent);
		console.log("- URL:", checkoutSession.url);
		console.log("- Metadata:", checkoutSession.metadata);

		// 4. Vérifier les paiements en base
		console.log("\n📊 Vérification des paiements en base...");
		const payments = await prisma.payment.findMany({
			where: {
				productId: testProduct.id,
			},
		});

		console.log(`📝 ${payments.length} paiements trouvés pour ce produit:`);
		payments.forEach((payment) => {
			console.log(
				`- ${payment.stripePaymentIntentId} (${payment.status}) - ${payment.amount}€`
			);
		});

		// 5. Simuler un webhook de succès
		console.log(
			"\n🔔 Simulation d'un webhook checkout.session.completed..."
		);

		const webhookEvent = {
			id: "evt_test_" + Date.now(),
			object: "event",
			api_version: "2023-08-16",
			created: Math.floor(Date.now() / 1000),
			data: {
				object: {
					id: checkoutSession.id,
					object: "checkout.session",
					amount_total: 1000,
					currency: "eur",
					status: "complete",
					payment_intent: checkoutSession.payment_intent,
					metadata: checkoutSession.metadata,
				},
			},
			livemode: false,
			pending_webhooks: 1,
			request: {
				id: "req_test_" + Date.now(),
				idempotency_key: null,
			},
			type: "checkout.session.completed",
		};

		console.log("📋 Webhook event:", JSON.stringify(webhookEvent, null, 2));

		// 6. Nettoyer les données de test
		console.log("\n🧹 Nettoyage des données de test...");
		await prisma.payment.deleteMany({
			where: {
				productId: testProduct.id,
			},
		});
		await prisma.product.delete({
			where: { id: testProduct.id },
		});
		console.log("✅ Données de test supprimées");
	} catch (error) {
		console.error("❌ Erreur lors du test:", error);
	} finally {
		await prisma.$disconnect();
	}
}

async function checkRecentPayments() {
	console.log("\n📊 Vérification des paiements récents...");

	try {
		const payments = await prisma.payment.findMany({
			take: 10,
			orderBy: { createdAt: "desc" },
			include: {
				product: {
					select: { title: true },
				},
				buyer: {
					select: { username: true },
				},
				seller: {
					select: { username: true },
				},
			},
		});

		console.log(`📝 ${payments.length} paiements récents:`);
		payments.forEach((payment) => {
			console.log(`- ${payment.stripePaymentIntentId}`);
			console.log(`  Status: ${payment.status}`);
			console.log(`  Amount: ${payment.amount}€`);
			console.log(`  Product: ${payment.product?.title || "N/A"}`);
			console.log(`  Buyer: ${payment.buyer?.username || "N/A"}`);
			console.log(`  Seller: ${payment.seller?.username || "N/A"}`);
			console.log(`  Created: ${payment.createdAt}`);
			console.log("");
		});
	} catch (error) {
		console.error("❌ Erreur lors de la vérification:", error);
	}
}

async function checkWebhookLogs() {
	console.log("\n📋 Conseils pour vérifier les logs webhook:");
	console.log("1. Vérifiez les logs de votre application Next.js");
	console.log(
		'2. Recherchez les messages commençant par "🔔 ===== WEBHOOK RECEIVED ====="'
	);
	console.log(
		"3. Vérifiez que le webhook est configuré dans Stripe Dashboard"
	);
	console.log("4. Testez avec un vrai paiement en mode test");
	console.log("5. Utilisez Stripe CLI pour tester les webhooks localement");
}

async function main() {
	await testPaymentFlow();
	await checkRecentPayments();
	await checkWebhookLogs();

	console.log("\n💡 Prochaines étapes de débogage:");
	console.log("1. Exécutez: node scripts/check-stripe-config.js");
	console.log("2. Vérifiez les logs de votre application");
	console.log("3. Testez un vrai paiement avec une carte de test");
	console.log(
		"4. Utilisez Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/payments/webhook"
	);
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testPaymentFlow, checkRecentPayments, checkWebhookLogs };
