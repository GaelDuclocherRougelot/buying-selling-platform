// Script de test pour les API de messagerie
// À exécuter après avoir démarré l'application

const BASE_URL = "http://localhost:3000";

async function testMessagingAPI() {
	console.log("🧪 Test des API de messagerie...\n");

	try {
		// Test 1: Endpoint de test
		console.log("1️⃣ Test de l'endpoint de test...");
		const testResponse = await fetch(`${BASE_URL}/api/messages/test`);
		if (testResponse.ok) {
			const testData = await testResponse.json();
			console.log("✅ Endpoint de test OK:", testData.message);
		} else {
			console.log("❌ Endpoint de test échoué:", testResponse.status);
		}

		// Test 2: Conversations (nécessite une session)
		console.log("\n2️⃣ Test de l'endpoint des conversations...");
		const conversationsResponse = await fetch(
			`${BASE_URL}/api/messages/conversations`
		);
		if (conversationsResponse.status === 401) {
			console.log(
				"✅ Endpoint des conversations protégé (401 Unauthorized)"
			);
		} else if (conversationsResponse.ok) {
			const conversationsData = await conversationsResponse.json();
			console.log(
				"✅ Endpoint des conversations OK:",
				conversationsData.conversations?.length || 0,
				"conversations"
			);
		} else {
			console.log(
				"❌ Endpoint des conversations échoué:",
				conversationsResponse.status
			);
		}

		console.log("\n🎉 Tests terminés !");
		console.log("\n📝 Pour tester complètement :");
		console.log("1. Démarrer l'application : pnpm run dev");
		console.log("2. Se connecter à l'application");
		console.log("3. Naviguer vers /auth/messages");
		console.log("4. Vérifier que les conversations se chargent");
	} catch (error) {
		console.error("❌ Erreur lors des tests:", error.message);
		console.log(
			"\n💡 Assurez-vous que l'application est démarrée (pnpm run dev)"
		);
	}
}

// Exécuter les tests
testMessagingAPI();
