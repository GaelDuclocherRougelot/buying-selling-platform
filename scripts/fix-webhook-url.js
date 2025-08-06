#!/usr/bin/env node

/**
 * Script pour corriger l'URL du webhook Stripe
 * Usage: node scripts/fix-webhook-url.js
 */

require("dotenv").config();
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function fixWebhookUrl() {
	console.log("🔧 Correction de l'URL du webhook Stripe...\n");

	try {
		// 1. Lister les webhooks existants
		console.log("📋 Webhooks existants:");
		const webhooks = await stripe.webhookEndpoints.list();

		if (webhooks.data.length === 0) {
			console.log("❌ Aucun webhook configuré");
			return;
		}

		webhooks.data.forEach((webhook, index) => {
			console.log(`${index + 1}. ${webhook.url} (${webhook.status})`);
			console.log(`   ID: ${webhook.id}`);
			console.log(`   Events: ${webhook.enabled_events.join(", ")}`);
			console.log("");
		});

		// 2. Identifier le webhook à corriger
		const wrongWebhook = webhooks.data.find(
			(webhook) =>
				webhook.url.includes("/api/stripe/webhook") &&
				!webhook.url.includes("/payments")
		);

		if (!wrongWebhook) {
			console.log("✅ Aucun webhook avec une URL incorrecte trouvé");
			return;
		}

		console.log(`🔍 Webhook à corriger: ${wrongWebhook.url}`);
		console.log(`📝 ID: ${wrongWebhook.id}`);

		// 3. Demander confirmation
		const readline = require("readline");
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question(
			"\nVoulez-vous corriger l'URL de ce webhook? (y/n): ",
			async (answer) => {
				if (answer.toLowerCase() === "y") {
					try {
						// 4. Supprimer l'ancien webhook
						console.log("🗑️ Suppression de l'ancien webhook...");
						await stripe.webhookEndpoints.del(wrongWebhook.id);
						console.log("✅ Ancien webhook supprimé");

						// 5. Créer le nouveau webhook avec la bonne URL
						console.log("➕ Création du nouveau webhook...");
						const newWebhook = await stripe.webhookEndpoints.create(
							{
								url: process.env.NEXT_PUBLIC_APP_URL
									? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/payments/webhook`
									: "https://votre-domaine.com/api/stripe/payments/webhook",
								enabled_events: [
									"checkout.session.completed",
									"payment_intent.succeeded",
									"payment_intent.payment_failed",
									"payment_method.attached",
									"payment_method.updated",
									"payment_method.detached",
									"account.updated",
								],
							}
						);

						console.log("✅ Nouveau webhook créé:");
						console.log(`   URL: ${newWebhook.url}`);
						console.log(`   ID: ${newWebhook.id}`);
						console.log(`   Secret: ${newWebhook.secret}`);

						console.log(
							"\n💡 Mettez à jour votre variable d'environnement:"
						);
						console.log(
							`STRIPE_WEBHOOK_SECRET=${newWebhook.secret}`
						);
					} catch (error) {
						console.error(
							"❌ Erreur lors de la correction:",
							error
						);
					}
				} else {
					console.log("❌ Correction annulée");
				}
				rl.close();
			}
		);
	} catch (error) {
		console.error("❌ Erreur:", error);
	}
}

async function createNewWebhook() {
	console.log("➕ Création d'un nouveau webhook avec la bonne URL...\n");

	try {
		const webhook = await stripe.webhookEndpoints.create({
			url: process.env.NEXT_PUBLIC_APP_URL
				? `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/payments/webhook`
				: "https://votre-domaine.com/api/stripe/payments/webhook",
			enabled_events: [
				"checkout.session.completed",
				"payment_intent.succeeded",
				"payment_intent.payment_failed",
				"payment_method.attached",
				"payment_method.updated",
				"payment_method.detached",
				"account.updated",
			],
		});

		console.log("✅ Webhook créé:");
		console.log(`   URL: ${webhook.url}`);
		console.log(`   ID: ${webhook.id}`);
		console.log(`   Secret: ${webhook.secret}`);

		console.log("\n💡 Mettez à jour votre variable d'environnement:");
		console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
	} catch (error) {
		console.error("❌ Erreur lors de la création:", error);
	}
}

async function main() {
	console.log("🔧 Outil de correction des webhooks Stripe\n");

	const readline = require("readline");
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question(
		"Que voulez-vous faire?\n1. Corriger un webhook existant\n2. Créer un nouveau webhook\n3. Quitter\nVotre choix (1-3): ",
		async (answer) => {
			switch (answer) {
				case "1":
					await fixWebhookUrl();
					break;
				case "2":
					await createNewWebhook();
					break;
				case "3":
					console.log("👋 Au revoir!");
					break;
				default:
					console.log("❌ Choix invalide");
			}
			rl.close();
		}
	);
}

if (require.main === module) {
	main().catch(console.error);
}

module.exports = { fixWebhookUrl, createNewWebhook };
