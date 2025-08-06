require("dotenv").config();
const Stripe = require("stripe");
const { PrismaClient } = require("@prisma/client");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

async function testRealPayment() {
	console.log("🧪 Test d'un vrai paiement avec webhook...\n");

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
		console.log(
			"- NEXT_PUBLIC_APP_URL:",
			process.env.NEXT_PUBLIC_APP_URL || "❌"
		);

		// 2. Créer une session de checkout
		console.log("\n🛒 Création d'une session de checkout...");
		const checkoutSession = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			line_items: [
				{
					price_data: {
						currency: "eur",
						product_data: {
							name: "Test de paiement",
							description: "Test pour vérifier les webhooks",
						},
						unit_amount: 1000, // 10€ en centimes
					},
					quantity: 1,
				},
			],
			success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile?payment=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile?payment=cancelled`,
			metadata: {
				productId: "test-product-id",
				buyerId: "test-buyer-id",
				sellerId: "test-seller-id",
			},
		});

		console.log("✅ Session créée:", checkoutSession.id);
		console.log("- URL:", checkoutSession.url);
		console.log("- Payment Intent:", checkoutSession.payment_intent);
		console.log("- Metadata:", checkoutSession.metadata);

		// 3. Instructions pour tester
		console.log("\n📋 Instructions pour tester:");
		console.log("1. Ouvrez cette URL dans votre navigateur:");
		console.log(checkoutSession.url);
		console.log("\n2. Utilisez une carte de test:");
		console.log("   - Numéro: 4242 4242 4242 4242");
		console.log("   - Date: N'importe quelle date future");
		console.log("   - CVC: 123");
		console.log("\n3. Complétez le paiement");
		console.log(
			"\n4. Vérifiez les logs de votre application pour voir le webhook"
		);

		// 4. Vérifier les webhooks configurés
		console.log("\n🔗 Webhooks configurés:");
		const webhooks = await stripe.webhookEndpoints.list();
		webhooks.data.forEach((webhook, index) => {
			console.log(`${index + 1}. ${webhook.url || "❌ Pas d'URL"}`);
			console.log(`   - Status: ${webhook.status}`);
			console.log(`   - Events: ${webhook.enabled_events.join(", ")}`);
		});

		// 5. Instructions pour configurer le webhook
		if (webhooks.data.length === 0) {
			console.log("\n⚠️ Aucun webhook configuré!");
			console.log("💡 Pour configurer un webhook:");
			console.log(
				"1. Allez dans Stripe Dashboard > Developers > Webhooks"
			);
			console.log("2. Cliquez sur 'Add endpoint'");
			console.log(
				"3. URL: http://localhost:3000/api/stripe/payments/webhook"
			);
			console.log(
				"4. Events: checkout.session.completed, payment_intent.succeeded"
			);
		} else {
			console.log("\n💡 Si aucun webhook n'a d'URL, ajoutez:");
			console.log("http://localhost:3000/api/stripe/payments/webhook");
		}
	} catch (error) {
		console.error("❌ Erreur lors du test:", error);
	} finally {
		await prisma.$disconnect();
	}
}

async function checkWebhookStatus() {
	console.log("\n🔍 Vérification du statut des webhooks...");

	try {
		const webhooks = await stripe.webhookEndpoints.list();

		if (webhooks.data.length === 0) {
			console.log("❌ Aucun webhook configuré");
			return;
		}

		webhooks.data.forEach((webhook, index) => {
			console.log(`\n${index + 1}. Webhook ${webhook.id}:`);
			console.log(`   - URL: ${webhook.url || "❌ Pas d'URL"}`);
			console.log(`   - Status: ${webhook.status}`);
			console.log(`   - Events: ${webhook.enabled_events.join(", ")}`);

			if (!webhook.url) {
				console.log("   ⚠️ Ce webhook n'a pas d'URL de destination!");
			}
		});
	} catch (error) {
		console.error("❌ Erreur lors de la vérification:", error);
	}
}

async function main() {
	await checkWebhookStatus();
	await testRealPayment();

	console.log("\n💡 Prochaines étapes:");
	console.log("1. Configurez l'URL de destination dans vos webhooks Stripe");
	console.log(
		"2. Utilisez Stripe CLI: stripe listen --forward-to localhost:3000/api/stripe/payments/webhook"
	);
	console.log("3. Testez un paiement avec la session créée");
	console.log("4. Vérifiez les logs de votre application");
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testRealPayment, checkWebhookStatus };
