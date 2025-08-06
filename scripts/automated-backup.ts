#!/usr/bin/env tsx

import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { DatabaseBackup } from "./backup-database";

// Load environment variables
config();

interface BackupConfig {
	type: "full" | "schema" | "data" | "tables";
	tables?: string[];
	retentionDays: number;
	compression: boolean;
	notifyOnSuccess?: boolean;
	notifyOnFailure?: boolean;
}

class AutomatedBackup {
	private backup: DatabaseBackup;
	private logFile: string;

	constructor() {
		this.backup = new DatabaseBackup();
		this.logFile = path.join(
			process.env.BACKUP_DIR || "./backups",
			"backup.log"
		);
	}

	private log(message: string) {
		const timestamp = new Date().toISOString();
		const logMessage = `[${timestamp}] ${message}\n`;

		console.log(message);

		// Ensure log directory exists
		const logDir = path.dirname(this.logFile);
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}

		// Append to log file
		fs.appendFileSync(this.logFile, logMessage);
	}

	private async sendNotification(message: string, isError: boolean = false) {
		// You can implement notification logic here
		// Examples: email, Slack, Discord, etc.

		if (isError) {
			this.log(`🚨 NOTIFICATION: ${message}`);
		} else {
			this.log(`📧 NOTIFICATION: ${message}`);
		}

		// Example: Send to webhook
		// await fetch(process.env.WEBHOOK_URL, {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify({ text: message })
		// });
	}

	async runScheduledBackup(config: BackupConfig) {
		const startTime = Date.now();

		try {
			this.log(`🔄 Starting scheduled backup (${config.type})`);

			let result;

			switch (config.type) {
				case "full":
					result = await this.backup.createFullBackup();
					break;

				case "schema":
					result = await this.backup.createSchemaOnlyBackup();
					break;

				case "data":
					result = await this.backup.createDataOnlyBackup();
					break;

				case "tables":
					if (!config.tables || config.tables.length === 0) {
						throw new Error(
							"Tables must be specified for table backup type"
						);
					}
					result = await this.backup.createTableBackup(config.tables);
					break;

				default:
					throw new Error(`Unknown backup type: ${config.type}`);
			}

			const duration = ((Date.now() - startTime) / 1000).toFixed(2);

			this.log(`✅ Backup completed successfully in ${duration}s`);
			this.log(`📁 File: ${result.filename}`);
			this.log(`📊 Size: ${result.size} MB`);

			// Cleanup old backups
			const deletedCount = await this.backup.cleanupOldBackups(
				config.retentionDays
			);
			if (deletedCount > 0) {
				this.log(`🧹 Cleaned up ${deletedCount} old backups`);
			}

			// Send success notification
			if (config.notifyOnSuccess) {
				await this.sendNotification(
					`✅ Backup completed successfully!\n` +
						`Type: ${config.type}\n` +
						`File: ${result.filename}\n` +
						`Size: ${result.size} MB\n` +
						`Duration: ${duration}s`
				);
			}

			return result;
		} catch (error) {
			const duration = ((Date.now() - startTime) / 1000).toFixed(2);
			const errorMessage = `❌ Backup failed after ${duration}s: ${error}`;

			this.log(errorMessage);

			// Send failure notification
			if (config.notifyOnFailure) {
				await this.sendNotification(errorMessage, true);
			}

			throw error;
		}
	}

	async runDailyBackup() {
		return this.runScheduledBackup({
			type: "full",
			retentionDays: 30,
			compression: true,
			notifyOnSuccess: true,
			notifyOnFailure: true,
		});
	}

	async runWeeklyBackup() {
		return this.runScheduledBackup({
			type: "full",
			retentionDays: 90,
			compression: true,
			notifyOnSuccess: true,
			notifyOnFailure: true,
		});
	}

	async runMonthlyBackup() {
		return this.runScheduledBackup({
			type: "full",
			retentionDays: 365,
			compression: true,
			notifyOnSuccess: true,
			notifyOnFailure: true,
		});
	}

	async runSchemaBackup() {
		return this.runScheduledBackup({
			type: "schema",
			retentionDays: 30,
			compression: false,
			notifyOnSuccess: false,
			notifyOnFailure: true,
		});
	}

	async runTableBackup(tables: string[]) {
		return this.runScheduledBackup({
			type: "tables",
			tables,
			retentionDays: 7,
			compression: true,
			notifyOnSuccess: false,
			notifyOnFailure: true,
		});
	}

	async getBackupStats() {
		const backups = await this.backup.listBackups();

		const stats = {
			totalBackups: backups.length,
			totalSize: 0,
			oldestBackup: null as any,
			newestBackup: null as any,
			byType: {
				full: 0,
				schema: 0,
				data: 0,
				tables: 0,
			},
		};

		if (backups.length > 0) {
			stats.oldestBackup = backups[backups.length - 1];
			stats.newestBackup = backups[0];

			backups.forEach((backup) => {
				const sizeMB = parseFloat(backup.size.replace(" MB", ""));
				stats.totalSize += sizeMB;

				if (backup.filename.includes("full-backup")) {
					stats.byType.full++;
				} else if (backup.filename.includes("schema-only")) {
					stats.byType.schema++;
				} else if (backup.filename.includes("data-only")) {
					stats.byType.data++;
				} else if (backup.filename.includes("tables-")) {
					stats.byType.tables++;
				}
			});
		}

		return stats;
	}

	async printBackupStats() {
		const stats = await this.getBackupStats();

		this.log("📊 Backup Statistics:");
		this.log(`  Total backups: ${stats.totalBackups}`);
		this.log(`  Total size: ${stats.totalSize.toFixed(2)} MB`);

		if (stats.oldestBackup) {
			this.log(
				`  Oldest backup: ${stats.oldestBackup.filename} (${stats.oldestBackup.modified.toLocaleDateString()})`
			);
		}

		if (stats.newestBackup) {
			this.log(
				`  Newest backup: ${stats.newestBackup.filename} (${stats.newestBackup.modified.toLocaleDateString()})`
			);
		}

		this.log("  By type:");
		this.log(`    Full backups: ${stats.byType.full}`);
		this.log(`    Schema backups: ${stats.byType.schema}`);
		this.log(`    Data backups: ${stats.byType.data}`);
		this.log(`    Table backups: ${stats.byType.tables}`);
	}
}

// CLI interface
async function main() {
	const automatedBackup = new AutomatedBackup();

	const command = process.argv[2];
	const options = process.argv[3];

	try {
		switch (command) {
			case "daily":
				await automatedBackup.runDailyBackup();
				break;

			case "weekly":
				await automatedBackup.runWeeklyBackup();
				break;

			case "monthly":
				await automatedBackup.runMonthlyBackup();
				break;

			case "schema":
				await automatedBackup.runSchemaBackup();
				break;

			case "tables":
				if (!options) {
					console.error(
						'❌ Please specify tables: npm run backup:auto:tables "table1,table2"'
					);
					process.exit(1);
				}
				const tables = options.split(",");
				await automatedBackup.runTableBackup(tables);
				break;

			case "stats":
				await automatedBackup.printBackupStats();
				break;

			default:
				console.log(`
🔄 Automated Backup Tool

Usage:
  npm run backup:auto:daily        - Run daily backup (full, 30 days retention)
  npm run backup:auto:weekly       - Run weekly backup (full, 90 days retention)
  npm run backup:auto:monthly      - Run monthly backup (full, 365 days retention)
  npm run backup:auto:schema       - Run schema backup (30 days retention)
  npm run backup:auto:tables "table1,table2" - Run table backup (7 days retention)
  npm run backup:auto:stats        - Show backup statistics

Environment Variables:
  DATABASE_URL     - Your PostgreSQL connection string
  BACKUP_DIR       - Backup directory (default: ./backups)
  WEBHOOK_URL      - Optional webhook URL for notifications

Cron Examples:
  # Daily backup at 2 AM
  0 2 * * * cd /path/to/project && npm run backup:auto:daily
  
  # Weekly backup on Sunday at 3 AM
  0 3 * * 0 cd /path/to/project && npm run backup:auto:weekly
  
  # Monthly backup on 1st at 4 AM
  0 4 1 * * cd /path/to/project && npm run backup:auto:monthly
        `);
		}
	} catch (error) {
		console.error("❌ Automated backup failed:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

export { AutomatedBackup };
