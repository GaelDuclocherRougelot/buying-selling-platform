#!/usr/bin/env tsx

import { exec } from "child_process";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

// Load environment variables
config();

const execAsync = promisify(exec);

interface BackupOptions {
	format?: "sql" | "custom" | "directory" | "tar";
	compression?: boolean;
	includeData?: boolean;
	includeSchema?: boolean;
	tables?: string[];
	excludeTables?: string[];
	outputDir?: string;
	filename?: string;
}

class DatabaseBackup {
	private databaseUrl: string;
	private backupDir: string;

	constructor() {
		this.databaseUrl = process.env.DATABASE_URL!;
		this.backupDir = process.env.BACKUP_DIR || "./backups";

		if (!this.databaseUrl) {
			throw new Error("DATABASE_URL environment variable is required");
		}
	}

	private parseDatabaseUrl() {
		const url = new URL(this.databaseUrl);
		return {
			host: url.hostname,
			port: url.port || "5432",
			database: url.pathname.slice(1),
			username: url.username,
			password: url.password,
		};
	}

	private async ensureBackupDirectory() {
		if (!fs.existsSync(this.backupDir)) {
			fs.mkdirSync(this.backupDir, { recursive: true });
		}
	}

	private generateFilename(options: BackupOptions = {}): string {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const format = options.format || "sql";
		const extension = format === "sql" ? "sql" : "backup";
		const compression = options.compression ? ".gz" : "";

		return (
			options.filename || `backup-${timestamp}.${extension}${compression}`
		);
	}

	async createBackup(options: BackupOptions = {}) {
		await this.ensureBackupDirectory();

		const dbConfig = this.parseDatabaseUrl();
		const filename = this.generateFilename(options);
		const outputPath = path.join(this.backupDir, filename);

		const format = options.format || "sql";
		const compression = options.compression ? "--compress=9" : "";

		// Build pg_dump command
		let command = `pg_dump`;

		// Connection parameters
		command += ` --host=${dbConfig.host}`;
		command += ` --port=${dbConfig.port}`;
		command += ` --username=${dbConfig.username}`;
		command += ` --dbname=${dbConfig.database}`;

		// Format options
		if (format === "custom") {
			command += " --format=custom";
		} else if (format === "directory") {
			command += " --format=directory";
		} else if (format === "tar") {
			command += " --format=tar";
		}

		// Data and schema options
		if (options.includeData === false) {
			command += " --data-only";
		} else if (options.includeSchema === false) {
			command += " --schema-only";
		}

		// Table filters
		if (options.tables && options.tables.length > 0) {
			options.tables.forEach((table) => {
				command += ` --table=${table}`;
			});
		}

		if (options.excludeTables && options.excludeTables.length > 0) {
			options.excludeTables.forEach((table) => {
				command += ` --exclude-table=${table}`;
			});
		}

		// Output and compression
		command += ` ${compression}`;
		command += ` --file="${outputPath}"`;

		// Set password environment variable
		const env = { ...process.env, PGPASSWORD: dbConfig.password };

		try {
			console.log(`🔄 Creating backup: ${filename}`);
			console.log(`📁 Output: ${outputPath}`);

			const { stdout, stderr } = await execAsync(command, { env });

			if (stderr) {
				console.warn("⚠️  Warnings during backup:", stderr);
			}

			console.log(`✅ Backup created successfully: ${outputPath}`);

			// Get file size
			const stats = fs.statSync(outputPath);
			const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
			console.log(`📊 File size: ${fileSizeInMB} MB`);

			return {
				success: true,
				filename,
				path: outputPath,
				size: fileSizeInMB,
				format,
			};
		} catch (error) {
			console.error("❌ Backup failed:", error);
			throw error;
		}
	}

	async createFullBackup() {
		return this.createBackup({
			format: "custom",
			compression: true,
			filename: `full-backup-${new Date().toISOString().split("T")[0]}.backup`,
		});
	}

	async createSchemaOnlyBackup() {
		return this.createBackup({
			format: "sql",
			includeSchema: true,
			includeData: false,
			filename: `schema-only-${new Date().toISOString().split("T")[0]}.sql`,
		});
	}

	async createDataOnlyBackup() {
		return this.createBackup({
			format: "sql",
			includeSchema: false,
			includeData: true,
			filename: `data-only-${new Date().toISOString().split("T")[0]}.sql`,
		});
	}

	async createTableBackup(tables: string[]) {
		return this.createBackup({
			format: "sql",
			tables,
			filename: `tables-${tables.join("-")}-${new Date().toISOString().split("T")[0]}.sql`,
		});
	}

	async listBackups() {
		await this.ensureBackupDirectory();

		const files = fs.readdirSync(this.backupDir);
		const backups = files
			.filter(
				(file) =>
					file.endsWith(".sql") ||
					file.endsWith(".backup") ||
					file.endsWith(".gz")
			)
			.map((file) => {
				const filePath = path.join(this.backupDir, file);
				const stats = fs.statSync(filePath);
				return {
					filename: file,
					size: (stats.size / (1024 * 1024)).toFixed(2) + " MB",
					created: stats.birthtime,
					modified: stats.mtime,
				};
			})
			.sort((a, b) => b.modified.getTime() - a.modified.getTime());

		return backups;
	}

	async cleanupOldBackups(daysToKeep: number = 30) {
		const backups = await this.listBackups();
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

		const oldBackups = backups.filter(
			(backup) => backup.modified < cutoffDate
		);

		for (const backup of oldBackups) {
			const filePath = path.join(this.backupDir, backup.filename);
			fs.unlinkSync(filePath);
			console.log(`🗑️  Deleted old backup: ${backup.filename}`);
		}

		console.log(`🧹 Cleaned up ${oldBackups.length} old backups`);
		return oldBackups.length;
	}
}

// CLI interface
async function main() {
	const backup = new DatabaseBackup();

	const command = process.argv[2];
	const options = process.argv[3];

	try {
		switch (command) {
			case "full":
				await backup.createFullBackup();
				break;

			case "schema":
				await backup.createSchemaOnlyBackup();
				break;

			case "data":
				await backup.createDataOnlyBackup();
				break;

			case "tables":
				if (!options) {
					console.error(
						'❌ Please specify tables: npm run backup:tables "table1,table2"'
					);
					process.exit(1);
				}
				const tables = options.split(",");
				await backup.createTableBackup(tables);
				break;

			case "list":
				const backups = await backup.listBackups();
				console.log("📋 Available backups:");
				backups.forEach((backup) => {
					console.log(
						`  ${backup.filename} (${backup.size}) - ${backup.modified.toLocaleDateString()}`
					);
				});
				break;

			case "cleanup":
				const days = parseInt(options) || 30;
				await backup.cleanupOldBackups(days);
				break;

			default:
				console.log(`
🔄 Database Backup Tool

Usage:
  npm run backup:full          - Create full backup (recommended)
  npm run backup:schema        - Create schema-only backup
  npm run backup:data          - Create data-only backup
  npm run backup:tables "table1,table2" - Backup specific tables
  npm run backup:list          - List all backups
  npm run backup:cleanup [days] - Clean up old backups (default: 30 days)

Environment Variables:
  DATABASE_URL     - Your PostgreSQL connection string
  BACKUP_DIR       - Backup directory (default: ./backups)
        `);
		}
	} catch (error) {
		console.error("❌ Backup failed:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

export { DatabaseBackup };
