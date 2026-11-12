import { prisma } from "@/lib/prisma";
import { LoginLogService } from "./login-log";

/** Domaine des emails de remplacement des comptes anonymisés */
const ANONYMIZED_EMAIL_DOMAIN = "deleted.invalid";

/**
 * Deletes users that have been soft-deleted for more than 12 months
 * This function should be called by a cron job
 *
 * Les comptes liés à des paiements sont anonymisés au lieu d'être supprimés :
 * les paiements doivent être conservés 10 ans (obligation comptable).
 */
export async function deleteExpiredUsers() {
	try {
		// Calculate the date 12 months ago
		const twelveMonthsAgo = new Date();
		twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

		// Find users that were soft-deleted more than 12 months ago
		const usersToDelete = await prisma.user.findMany({
			where: {
				deletedAt: {
					not: null,
					lt: twelveMonthsAgo,
				},
				// Comptes déjà anonymisés lors d'un passage précédent
				NOT: { email: { endsWith: `@${ANONYMIZED_EMAIL_DOMAIN}` } },
			},
			include: {
				sessions: true,
				accounts: true,
				products: true,
				PaymentBuyer: true,
				PaymentSeller: true,
			},
		});

		if (usersToDelete.length === 0) {
			console.log(
				"No users to delete - all soft-deleted users are within the 12-month retention period"
			);
			return { deletedCount: 0, message: "No users to delete" };
		}

		console.log(
			`Found ${usersToDelete.length} users to permanently delete`
		);

		// Delete related data first (cascade should handle this, but we're being explicit)
		for (const user of usersToDelete) {
			// Delete sessions
			if (user.sessions.length > 0) {
				await prisma.session.deleteMany({
					where: { userId: user.id },
				});
			}

			// Delete accounts
			if (user.accounts.length > 0) {
				await prisma.account.deleteMany({
					where: { userId: user.id },
				});
			}

			// Delete products (ceux liés à un paiement sont conservés avec lui)
			if (user.products.length > 0) {
				await prisma.product.deleteMany({
					where: { ownerId: user.id, payments: { none: {} } },
				});
			}

			// Compte lié à des paiements : anonymiser au lieu de supprimer
			if (user.PaymentBuyer.length > 0 || user.PaymentSeller.length > 0) {
				await prisma.conversation.deleteMany({
					where: {
						OR: [{ buyerId: user.id }, { sellerId: user.id }],
					},
				});
				await prisma.favorite.deleteMany({ where: { userId: user.id } });
				await prisma.loginLog.deleteMany({ where: { userId: user.id } });
				await prisma.user.update({
					where: { id: user.id },
					data: {
						name: "Utilisateur supprimé",
						email: `deleted-${user.id}@${ANONYMIZED_EMAIL_DOMAIN}`,
						emailVerified: false,
						image: null,
						username: null,
						displayUsername: null,
					},
				});
			}
		}

		// Finally, delete the users without payments
		const deleteResult = await prisma.user.deleteMany({
			where: {
				id: {
					in: usersToDelete
						.filter(
							(user) =>
								user.PaymentBuyer.length === 0 &&
								user.PaymentSeller.length === 0
						)
						.map((user) => user.id),
				},
			},
		});

		console.log(
			`Successfully deleted ${deleteResult.count} users permanently`
		);

		return {
			deletedCount: deleteResult.count,
			message: `Successfully deleted ${deleteResult.count} users permanently`,
			deletedUsers: usersToDelete.map((user) => ({
				id: user.id,
				email: user.email,
				deletedAt: user.deletedAt,
			})),
		};
	} catch (error) {
		console.error("Error deleting expired users:", error);
		throw new Error(
			`Failed to delete expired users: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
}

/**
 * Get statistics about soft-deleted users
 */
export async function getSoftDeletedUsersStats() {
	const twelveMonthsAgo = new Date();
	twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

	const [totalSoftDeleted, expiredUsers] = await Promise.all([
		prisma.user.count({
			where: {
				deletedAt: {
					not: null,
				},
			},
		}),
		prisma.user.count({
			where: {
				deletedAt: {
					not: null,
					lt: twelveMonthsAgo,
				},
			},
		}),
	]);

	return {
		totalSoftDeleted,
		expiredUsers,
		retentionPeriod: "12 months",
	};
}

/** Durée de conservation des journaux d'erreurs (recommandation CNIL : 6 mois à 1 an) */
const ERROR_LOG_RETENTION_DAYS = 180;

// Suppression des journaux d'erreurs (IP, navigateur) au-delà de la durée de conservation
export async function cleanupErrorLogs(): Promise<number> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - ERROR_LOG_RETENTION_DAYS);

	const result = await prisma.errorLog.deleteMany({
		where: { createdAt: { lt: cutoffDate } },
	});

	return result.count;
}

// Nettoyage automatique des logs de connexion (tous les jours à 2h du matin)
export async function cleanupLoginLogs() {
	try {
		console.log("🧹 Nettoyage automatique des logs de connexion...");

		const deletedCount = await LoginLogService.deleteOldLogs(90);

		console.log(`✅ ${deletedCount} logs de connexion supprimés`);

		return {
			success: true,
			deletedCount,
			message: `Nettoyage terminé: ${deletedCount} logs supprimés`,
		};
	} catch (error) {
		console.error("❌ Erreur lors du nettoyage des logs:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erreur inconnue",
		};
	}
}
