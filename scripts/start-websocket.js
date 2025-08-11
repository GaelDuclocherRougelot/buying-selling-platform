#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Démarrage du serveur WebSocket...");

// Vérifier que le serveur principal est en cours d'exécution
const checkMainServer = () => {
	return new Promise((resolve) => {
		const http = require("http");
		const req = http.request(
			{
				hostname: "localhost",
				port: 3000,
				path: "/",
				method: "GET",
				timeout: 5000,
			},
			(res) => {
				if (res.statusCode === 200) {
					console.log(
						"✅ Serveur principal détecté sur le port 3000"
					);
					resolve(true);
				} else {
					console.log(
						"⚠️ Serveur principal répond mais avec un statut inattendu:",
						res.statusCode
					);
					resolve(false);
				}
			}
		);

		req.on("error", () => {
			console.log("❌ Serveur principal non détecté sur le port 3000");
			resolve(false);
		});

		req.on("timeout", () => {
			console.log(
				"⏰ Timeout lors de la vérification du serveur principal"
			);
			resolve(false);
		});

		req.end();
	});
};

// Démarrer le serveur WebSocket
const startWebSocketServer = () => {
	const websocketPath = path.join(
		__dirname,
		"..",
		"src",
		"lib",
		"websocket-server.ts"
	);

	console.log("📁 Chemin du serveur WebSocket:", websocketPath);

	// Utiliser tsx pour exécuter le fichier TypeScript
	const websocketProcess = spawn("npx", ["tsx", websocketPath], {
		stdio: "inherit",
		shell: true,
		env: {
			...process.env,
			NODE_ENV: "development",
		},
	});

	websocketProcess.on("error", (error) => {
		console.error(
			"❌ Erreur lors du démarrage du serveur WebSocket:",
			error
		);
		process.exit(1);
	});

	websocketProcess.on("exit", (code) => {
		if (code !== 0) {
			console.error(`❌ Serveur WebSocket arrêté avec le code: ${code}`);
			process.exit(code);
		}
	});

	// Gérer l'interruption
	process.on("SIGINT", () => {
		console.log("\n🛑 Arrêt du serveur WebSocket...");
		websocketProcess.kill("SIGINT");
	});

	process.on("SIGTERM", () => {
		console.log("🛑 Arrêt du serveur WebSocket...");
		websocketProcess.kill("SIGTERM");
	});

	return websocketProcess;
};

// Fonction principale
const main = async () => {
	try {
		// Vérifier le serveur principal
		const mainServerRunning = await checkMainServer();

		if (!mainServerRunning) {
			console.log(
				"⚠️ Le serveur principal ne semble pas être en cours d'exécution"
			);
			console.log(
				'💡 Assurez-vous de démarrer le serveur Next.js avec "npm run dev"'
			);
			console.log("⏳ Démarrage du serveur WebSocket quand même...");
		}

		// Démarrer le serveur WebSocket
		const websocketProcess = startWebSocketServer();

		console.log("✅ Serveur WebSocket démarré avec succès");
		console.log("📍 URL: http://localhost:3001");
		console.log("🔌 Pour arrêter: Ctrl+C");
	} catch (error) {
		console.error("💥 Erreur lors du démarrage:", error);
		process.exit(1);
	}
};

// Démarrer
main();
