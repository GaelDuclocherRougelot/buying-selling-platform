require("dotenv").config();
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkStripeConfig() {
	console.log("🔍 Vérification de la configuration Stripe...\n");

	try {
		// 1. Vérifier les variables d'environnement
		console.log("📋 Variables d'environnement:");
		console.log(
			"- STRIPE_SECRET_KEY:",
			process.env.STRIPE_SECRET_KEY ? "✅ Configuré" : "❌ Manquant"
		);
		console.log(
			"- STRIPE_WEBHOOK_SECRET:",
			process.env.STRIPE_WEBHOOK_SECRET ? "✅ Configuré" : "❌ Manquant"
		);
		console.log(
			"- NEXT_PUBLIC_APP_URL:",
			process.env.NEXT_PUBLIC_APP_URL || "❌ Manquant"
		);

		// 2. Tester la connexion Stripe
		console.log("\n🔗 Test de connexion Stripe...");
		const account = await stripe.accounts.retrieve();
		console.log(`✅ Connexion Stripe OK - Account: ${account.id}`);
		console.log(`- Mode: ${account.charges_enabled ? "Live" : "Test"}`);

		// 3. Lister les webhooks
		console.log("\n🔗 Webhooks configurés:");
		const webhooks = await stripe.webhookEndpoints.list();

		if (webhooks.data.length === 0) {
			console.log("❌ Aucun webhook configuré");
			console.log("\n💡 Pour configurer un webhook:");
			console.log(
				"1. Allez dans Stripe Dashboard > Developers > Webhooks"
			);
			console.log('2. Cliquez sur "Add endpoint"');
			console.log(
				"3. URL: https://votre-domaine.com/api/stripe/payments/webhook"
			);
			console.log(
				"4. Events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed"
			);
		} else {
			webhooks.data.forEach((webhook, index) => {
				console.log(`\n${index + 1}. ${webhook.url}`);
				console.log(`   - Status: ${webhook.status}`);
				console.log(
					`   - Events: ${webhook.enabled_events.join(", ")}`
				);
				console.log(
					`   - Secret: ${webhook.secret ? "✅ Configuré" : "❌ Manquant"}`
				);
			});
		}

		// 4. Vérifier les événements récents
		console.log("\n📊 Événements récents (derniers 10):");
		const events = await stripe.events.list({ limit: 10 });

		if (events.data.length === 0) {
			console.log("❌ Aucun événement récent");
		} else {
			events.data.forEach((event) => {
				console.log(`- ${event.type} (${event.created}) - ${event.id}`);
				if (event.data.object.metadata) {
					console.log(`  Metadata:`, event.data.object.metadata);
				}
			});
		}

		// 5. Vérifier les sessions de checkout récentes
		console.log("\n🛒 Sessions de checkout récentes:");
		const sessions = await stripe.checkout.sessions.list({ limit: 5 });

		if (sessions.data.length === 0) {
			console.log("❌ Aucune session de checkout récente");
		} else {
			sessions.data.forEach((session) => {
				console.log(`- ${session.id} (${session.status})`);
				console.log(
					`  - Payment Intent: ${session.payment_intent || "null"}`
				);
				console.log(`  - Amount: ${session.amount_total} cents`);
				console.log(`  - Metadata:`, session.metadata);
			});
		}

		// 6. Vérifier les payment intents récents
		console.log("\n💳 Payment Intents récents:");
		const paymentIntents = await stripe.paymentIntents.list({ limit: 5 });

		if (paymentIntents.data.length === 0) {
			console.log("❌ Aucun payment intent récent");
		} else {
			paymentIntents.data.forEach((pi) => {
				console.log(`- ${pi.id} (${pi.status})`);
				console.log(`  - Amount: ${pi.amount} cents`);
				console.log(`  - Metadata:`, pi.metadata);
			});
		}
	} catch (error) {
		console.error("❌ Erreur lors de la vérification:", error);
	}
}

async function createTestWebhook() {
	console.log("\n🔧 Création d'un webhook de test...");

	try {
		const webhook = await stripe.webhookEndpoints.create({
			url: "https://votre-domaine.com/api/stripe/payments/webhook",
			enabled_events: [
				"checkout.session.completed",
				"payment_intent.succeeded",
				"payment_intent.payment_failed",
			],
		});

		console.log("✅ Webhook créé:", webhook.id);
		console.log("🔑 Secret:", webhook.secret);
		console.log("\n💡 Ajoutez ce secret à votre .env:");
		console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
	} catch (error) {
		console.error("❌ Erreur lors de la création du webhook:", error);
	}
}

async function main() {
	await checkStripeConfig();

	console.log("\n💡 Prochaines étapes:");
	console.log(
		"1. Vérifiez que votre webhook est configuré dans Stripe Dashboard"
	);
	console.log(
		"2. Assurez-vous que STRIPE_WEBHOOK_SECRET correspond au secret du webhook"
	);
	console.log("3. Testez un paiement en mode test");
	console.log("4. Vérifiez les logs de votre application");

	// Demander si l'utilisateur veut créer un webhook de test
	const readline = require("readline");
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question(
		"\nVoulez-vous créer un webhook de test? (y/n): ",
		async (answer) => {
			if (answer.toLowerCase() === "y") {
				await createTestWebhook();
			}
			rl.close();
		}
	);
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { checkStripeConfig, createTestWebhook };
