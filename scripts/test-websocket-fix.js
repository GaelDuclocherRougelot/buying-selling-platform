#!/usr/bin/env node

/**
 * Script de test pour vérifier les corrections du système WebSocket
 */

const { io } = require("socket.io-client");

console.log("🧪 Test des corrections du système WebSocket");
console.log("=".repeat(50));

// Configuration
const WEBSOCKET_URL =
	process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001";
const TEST_USER_ID = "test-user-123";
const TEST_CONVERSATION_ID = "test-conv-456";

console.log(`📡 Connexion à: ${WEBSOCKET_URL}`);

// Créer la connexion
const socket = io(WEBSOCKET_URL, {
	transports: ["websocket"],
	autoConnect: true,
	timeout: 5000,
});

let testsPassed = 0;
let testsFailed = 0;

function passTest(testName) {
	console.log(`✅ ${testName}`);
	testsPassed++;
}

function failTest(testName, error) {
	console.log(`❌ ${testName}: ${error}`);
	testsFailed++;
}

// Test 1: Connexion
socket.on("connect", () => {
	passTest("Connexion WebSocket établie");

	// Test 2: Authentification
	socket.emit("authenticate", { userId: TEST_USER_ID });
});

socket.on("authenticated", (data) => {
	passTest("Authentification réussie");

	// Test 3: Rejoindre une conversation
	socket.emit("join_conversation", { conversationId: TEST_CONVERSATION_ID });
	passTest("Rejoindre une conversation");

	// Test 4: Envoyer un message de test
	socket.emit("send_message", {
		conversationId: TEST_CONVERSATION_ID,
		content: "Message de test automatique",
		messageType: "text",
	});
});

socket.on("message_sent", (data) => {
	if (data.success) {
		passTest("Envoi de message confirmé");
	} else {
		failTest("Envoi de message", "Échec de l'envoi");
	}
});

socket.on("new_message", (message) => {
	if (message.data.content === "Message de test automatique") {
		passTest("Réception du message en temps réel");
	}
});

// Test 5: Gestion d'erreurs
socket.on("error", (error) => {
	failTest("Erreur WebSocket", error.message);
});

socket.on("connect_error", (error) => {
	failTest("Erreur de connexion", error.message);
});

// Déconnexion et résumé après 10 secondes
setTimeout(() => {
	socket.disconnect();

	console.log("\n" + "=".repeat(50));
	console.log("📊 RÉSUMÉ DES TESTS");
	console.log(`✅ Tests réussis: ${testsPassed}`);
	console.log(`❌ Tests échoués: ${testsFailed}`);

	if (testsFailed === 0) {
		console.log("🎉 Tous les tests sont passés !");
		process.exit(0);
	} else {
		console.log("⚠️  Certains tests ont échoué");
		process.exit(1);
	}
}, 10000);

console.log("⏳ Tests en cours... (10 secondes)");

