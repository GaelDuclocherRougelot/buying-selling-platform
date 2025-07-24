#!/usr/bin/env tsx

/**
 * Standalone script to delete users that have been soft-deleted for more than 12 months
 * This script can be run as a cron job
 *
 * Usage:
 * - Development: npm run delete-expired-users
 * - Production: Add to crontab: 0 2 * * * /path/to/your/project/scripts/delete-expired-users.ts
 */

import {
	deleteExpiredUsers,
	getSoftDeletedUsersStats,
} from "../src/services/cron";

async function main() {
	try {
		console.log("Starting expired users cleanup...");
		console.log("Timestamp:", new Date().toISOString());

		// Get stats before deletion
		const stats = await getSoftDeletedUsersStats();
		console.log("Current stats:", stats);

		// Delete expired users
		const result = await deleteExpiredUsers();
		console.log("Cleanup result:", result);

		// Get stats after deletion
		const statsAfter = await getSoftDeletedUsersStats();
		console.log("Stats after cleanup:", statsAfter);

		console.log("Expired users cleanup completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("Failed to cleanup expired users:", error);
		process.exit(1);
	}
}

// Only run if this file is executed directly
if (require.main === module) {
	main();
}
