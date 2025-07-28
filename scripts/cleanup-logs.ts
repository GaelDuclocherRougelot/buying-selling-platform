import { LoginLogService } from "../src/services/login-log";

async function cleanupOldLogs() {
	try {
		console.log("🧹 Nettoyage des anciens logs de connexion...");

		// Supprimer les logs de plus de 90 jours
		const deletedCount = await LoginLogService.deleteOldLogs(90);

		console.log(`✅ ${deletedCount} logs supprimés (plus de 90 jours)`);

		// Afficher les statistiques actuelles
		const stats = await LoginLogService.getLoginStats(undefined, 30);
		console.log("📊 Statistiques actuelles (30 derniers jours):", stats);
	} catch (error) {
		console.error("❌ Erreur lors du nettoyage:", error);
		process.exit(1);
	}
}

// Exécuter le nettoyage si le script est appelé directement
if (require.main === module) {
	cleanupOldLogs()
		.then(() => {
			console.log("✅ Nettoyage terminé avec succès !");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Erreur fatale:", error);
			process.exit(1);
		});
}
