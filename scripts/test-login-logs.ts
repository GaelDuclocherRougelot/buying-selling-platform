import { prisma } from "../src/lib/prisma";
import { LoginLogService } from "../src/services/login-log";

async function testLoginLogs() {
	try {
		console.log("🧪 Test du système de logs de connexion...");

		// Récupérer un utilisateur existant ou créer un utilisateur de test
		let testUser = await prisma.user.findFirst({
			where: {
				email: "test@example.com",
			},
		});

		if (!testUser) {
			console.log("Création d'un utilisateur de test...");
			testUser = await prisma.user.create({
				data: {
					id: "test-user-id",
					name: "Utilisateur Test",
					email: "test@example.com",
					emailVerified: true,
					role: "user",
				},
			});
			console.log("✅ Utilisateur de test créé:", testUser.id);
		}

		// Créer quelques logs de test
		const testLogs = [
			{
				userId: testUser.id,
				action: "login" as const,
				ipAddress: "192.168.1.100",
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				location: "Paris, France",
				success: true,
			},
			{
				userId: testUser.id,
				action: "failed_login" as const,
				ipAddress: "192.168.1.100",
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				location: "Paris, France",
				success: false,
				failureReason: "Mot de passe incorrect",
			},
			{
				userId: testUser.id,
				action: "login" as const,
				ipAddress: "10.0.0.50",
				userAgent:
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
				location: "Lyon, France",
				success: true,
			},
			{
				userId: testUser.id,
				action: "logout" as const,
				ipAddress: "192.168.1.100",
				userAgent:
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				location: "Paris, France",
				success: true,
			},
			{
				userId: testUser.id,
				action: "password_reset" as const,
				ipAddress: "172.16.0.25",
				userAgent:
					"Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15",
				location: "Marseille, France",
				success: true,
			},
		];

		// Créer les logs
		for (const logData of testLogs) {
			const log = await LoginLogService.create(logData);
			console.log(`✅ Log créé: ${log.action} pour ${log.userId}`);
		}

		// Récupérer les logs
		const logs = await LoginLogService.findMany({ limit: 10 });
		console.log(`📊 ${logs.length} logs récupérés`);

		// Obtenir les statistiques
		const stats = await LoginLogService.getLoginStats(undefined, 30);
		console.log("📈 Statistiques:", stats);

		// Tester les filtres
		const failedLogs = await LoginLogService.findMany({
			action: "failed_login",
			limit: 5,
		});
		console.log(`❌ ${failedLogs.length} échecs de connexion trouvés`);

		console.log("✅ Test terminé avec succès !");
	} catch (error) {
		console.error("❌ Erreur lors du test:", error);
	}
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
	testLoginLogs()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Erreur fatale:", error);
			process.exit(1);
		});
}
