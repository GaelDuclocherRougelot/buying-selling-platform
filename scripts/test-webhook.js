require("dotenv").config();
const Stripe = require("stripe");
const fetch = require("node-fetch");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_URL =
	process.env.WEBHOOK_URL ||
	"http://localhost:3000/api/stripe/payments/webhook";

async function testWebhook() {
	console.log("🧪 Test du webhook Stripe...");

	try {
		// 1. Vérifier la configuration
		console.log("\n📋 Configuration:");
		console.log(
			"- STRIPE_SECRET_KEY:",
			process.env.STRIPE_SECRET_KEY ? "✅ Configuré" : "❌ Manquant"
		);
		console.log(
			"- STRIPE_WEBHOOK_SECRET:",
			process.env.STRIPE_WEBHOOK_SECRET ? "✅ Configuré" : "❌ Manquant"
		);
		console.log("- WEBHOOK_URL:", WEBHOOK_URL);

		// 2. Lister les webhooks configurés
		console.log("\n🔗 Webhooks configurés:");
		const webhooks = await stripe.webhookEndpoints.list();
		webhooks.data.forEach((webhook) => {
			console.log(`- ${webhook.url} (${webhook.status})`);
			console.log(`  Events: ${webhook.enabled_events.join(", ")}`);
		});

		// 3. Tester avec un événement factice
		console.log("\n🧪 Test avec événement factice...");

		const testEvent = {
			id: "evt_test_" + Date.now(),
			object: "event",
			api_version: "2023-08-16",
			created: Math.floor(Date.now() / 1000),
			data: {
				object: {
					id: "pi_test_" + Date.now(),
					object: "payment_intent",
					amount: 1000,
					currency: "eur",
					status: "succeeded",
					metadata: {
						productId: "test-product-id",
						buyerId: "test-buyer-id",
						sellerId: "test-seller-id",
					},
				},
			},
			livemode: false,
			pending_webhooks: 1,
			request: {
				id: "req_test_" + Date.now(),
				idempotency_key: null,
			},
			type: "payment_intent.succeeded",
		};

		// Créer la signature
		const crypto = require("crypto");
		const timestamp = Math.floor(Date.now() / 1000);
		const payload = JSON.stringify(testEvent);
		const signedPayload = `${timestamp}.${payload}`;
		const signature = crypto
			.createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
			.update(signedPayload, "utf8")
			.digest("hex");

		const response = await fetch(WEBHOOK_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Stripe-Signature": `t=${timestamp},v1=${signature}`,
			},
			body: payload,
		});

		console.log("\n📊 Réponse du webhook:");
		console.log("- Status:", response.status);
		console.log(
			"- Headers:",
			Object.fromEntries(response.headers.entries())
		);

		const responseText = await response.text();
		console.log("- Body:", responseText);
	} catch (error) {
		console.error("❌ Erreur lors du test:", error);
	}
}

// Fonction pour vérifier les paiements en base
async function checkPayments() {
	console.log("\n📊 Vérification des paiements en base...");

	try {
		const { PrismaClient } = require("@prisma/client");
		const prisma = new PrismaClient();

		const payments = await prisma.payment.findMany({
			take: 10,
			orderBy: { createdAt: "desc" },
		});

		console.log(`📝 ${payments.length} paiements trouvés:`);
		payments.forEach((payment) => {
			console.log(
				`- ${payment.stripePaymentIntentId} (${payment.status}) - ${payment.amount}€`
			);
		});

		await prisma.$disconnect();
	} catch (error) {
		console.error(
			"❌ Erreur lors de la vérification des paiements:",
			error
		);
	}
}

// Fonction pour vérifier les logs récents
async function checkLogs() {
	console.log("\n📋 Vérification des logs récents...");
	console.log(
		"Vérifiez les logs de votre application pour voir si le webhook est reçu."
	);
	console.log('Recherchez les messages commençant par "🔔 Webhook reçu"');
}

async function main() {
	await testWebhook();
	await checkPayments();
	await checkLogs();

	console.log("\n✅ Test terminé");
	console.log("\n💡 Conseils de débogage:");
	console.log(
		"1. Vérifiez que le webhook est configuré dans Stripe Dashboard"
	);
	console.log(
		"2. Vérifiez que STRIPE_WEBHOOK_SECRET correspond à votre webhook"
	);
	console.log("3. Vérifiez les logs de votre application");
	console.log("4. Testez avec un vrai paiement en mode test");
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testWebhook, checkPayments, checkLogs };
