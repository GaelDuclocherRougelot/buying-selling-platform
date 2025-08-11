#!/usr/bin/env node

const io = require("socket.io-client");

const WEBSOCKET_URL = process.env.WEBSOCKET_URL || "http://localhost:3001";
const TEST_USER_ID = "test-user-" + Date.now();

console.log("🧪 Test du serveur WebSocket");
console.log(`📍 URL: ${WEBSOCKET_URL}`);
console.log(`👤 Utilisateur de test: ${TEST_USER_ID}`);

// Créer une connexion WebSocket
const socket = io(WEBSOCKET_URL, {
	transports: ["websocket"],
	timeout: 10000,
});

// Gérer les événements de connexion
socket.on("connect", () => {
	console.log("✅ Connecté au serveur WebSocket");

	// Authentifier l'utilisateur
	console.log("🔐 Authentification...");
	socket.emit("authenticate", { userId: TEST_USER_ID });
});

socket.on("authenticated", (data) => {
	console.log("✅ Authentifié:", data);

	// Rejoindre une conversation de test
	const testConversationId = "test-conversation-" + Date.now();
	console.log(`🚀 Rejoindre la conversation: ${testConversationId}`);
	socket.emit("join_conversation", { conversationId: testConversationId });

	// Envoyer un message de test
	setTimeout(() => {
		console.log("📤 Envoi d'un message de test...");
		socket.emit("send_message", {
			conversationId: testConversationId,
			content: "Message de test " + new Date().toISOString(),
			messageType: "text",
		});
	}, 1000);
});

socket.on("message_sent", (data) => {
	console.log("✅ Message envoyé:", data);
});

socket.on("new_message", (message) => {
	console.log("📨 Nouveau message reçu:", message);
});

socket.on("error", (error) => {
	console.error("❌ Erreur:", error);
});

socket.on("disconnect", (reason) => {
	console.log("❌ Déconnecté:", reason);
});

socket.on("connect_error", (error) => {
	console.error("❌ Erreur de connexion:", error);
});

// Nettoyer après 10 secondes
setTimeout(() => {
	console.log("🧹 Nettoyage...");
	socket.disconnect();
	process.exit(0);
}, 10000);

// Gérer l'interruption
process.on("SIGINT", () => {
	console.log("\n🛑 Interruption détectée");
	socket.disconnect();
	process.exit(0);
});
