#!/usr/bin/env tsx

import { exec } from "child_process";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

// Load environment variables
config();

const execAsync = promisify(exec);

interface RestoreOptions {
	backupFile: string;
	createDatabase?: boolean;
	dropDatabase?: boolean;
	clean?: boolean;
	dataOnly?: boolean;
	schemaOnly?: boolean;
	tables?: string[];
	excludeTables?: string[];
}

class DatabaseRestore {
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
			throw new Error(
				`Backup directory does not exist: ${this.backupDir}`
			);
		}
	}

	async listAvailableBackups() {
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
					path: filePath,
				};
			})
			.sort((a, b) => b.modified.getTime() - a.modified.getTime());

		return backups;
	}

	private detectBackupFormat(
		backupFile: string
	): "sql" | "custom" | "directory" | "tar" {
		if (backupFile.endsWith(".sql") || backupFile.endsWith(".sql.gz")) {
			return "sql";
		} else if (backupFile.endsWith(".backup")) {
			return "custom";
		} else if (backupFile.endsWith(".tar")) {
			return "tar";
		} else {
			// Assume directory format
			return "directory";
		}
	}

	async restoreBackup(options: RestoreOptions) {
		const dbConfig = this.parseDatabaseUrl();
		const backupPath = path.resolve(options.backupFile);

		if (!fs.existsSync(backupPath)) {
			throw new Error(`Backup file not found: ${backupPath}`);
		}

		const format = this.detectBackupFormat(options.backupFile);

		console.log(`🔄 Starting restore from: ${options.backupFile}`);
		console.log(`📊 Format detected: ${format}`);
		console.log(`🎯 Target database: ${dbConfig.database}`);

		// Build restore command
		let command = format === "custom" ? "pg_restore" : "psql";

		if (format === "custom") {
			command += ` --host=${dbConfig.host}`;
			command += ` --port=${dbConfig.port}`;
			command += ` --username=${dbConfig.username}`;
			command += ` --dbname=${dbConfig.database}`;

			if (options.clean) {
				command += " --clean";
			}

			if (options.dataOnly) {
				command += " --data-only";
			} else if (options.schemaOnly) {
				command += " --schema-only";
			}

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

			command += ` "${backupPath}"`;
		} else {
			// SQL format
			command += ` --host=${dbConfig.host}`;
			command += ` --port=${dbConfig.port}`;
			command += ` --username=${dbConfig.username}`;
			command += ` --dbname=${dbConfig.database}`;

			if (options.clean) {
				command += " --set ON_ERROR_STOP=on";
			}

			command += ` --file="${backupPath}"`;
		}

		// Set password environment variable
		const env = { ...process.env, PGPASSWORD: dbConfig.password };

		try {
			console.log(`🚀 Executing restore command...`);

			const { stdout, stderr } = await execAsync(command, { env });

			if (stderr) {
				console.warn("⚠️  Warnings during restore:", stderr);
			}

			if (stdout) {
				console.log("📝 Restore output:", stdout);
			}

			console.log(`✅ Restore completed successfully!`);

			return {
				success: true,
				backupFile: options.backupFile,
				database: dbConfig.database,
				format,
			};
		} catch (error) {
			console.error("❌ Restore failed:", error);
			throw error;
		}
	}

	async restoreFullBackup(
		backupFile: string,
		options: Partial<RestoreOptions> = {}
	) {
		return this.restoreBackup({
			backupFile,
			clean: true,
			...options,
		});
	}

	async restoreSchemaOnly(
		backupFile: string,
		options: Partial<RestoreOptions> = {}
	) {
		return this.restoreBackup({
			backupFile,
			schemaOnly: true,
			...options,
		});
	}

	async restoreDataOnly(
		backupFile: string,
		options: Partial<RestoreOptions> = {}
	) {
		return this.restoreBackup({
			backupFile,
			dataOnly: true,
			...options,
		});
	}

	async restoreTables(
		backupFile: string,
		tables: string[],
		options: Partial<RestoreOptions> = {}
	) {
		return this.restoreBackup({
			backupFile,
			tables,
			...options,
		});
	}

	async createDatabase(databaseName: string) {
		const dbConfig = this.parseDatabaseUrl();

		const command = `createdb --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} "${databaseName}"`;
		const env = { ...process.env, PGPASSWORD: dbConfig.password };

		try {
			console.log(`🔄 Creating database: ${databaseName}`);
			await execAsync(command, { env });
			console.log(`✅ Database created successfully: ${databaseName}`);
		} catch (error) {
			console.error("❌ Failed to create database:", error);
			throw error;
		}
	}

	async dropDatabase(databaseName: string) {
		const dbConfig = this.parseDatabaseUrl();

		const command = `dropdb --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} "${databaseName}"`;
		const env = { ...process.env, PGPASSWORD: dbConfig.password };

		try {
			console.log(`🔄 Dropping database: ${databaseName}`);
			await execAsync(command, { env });
			console.log(`✅ Database dropped successfully: ${databaseName}`);
		} catch (error) {
			console.error("❌ Failed to drop database:", error);
			throw error;
		}
	}

	async testConnection() {
		const dbConfig = this.parseDatabaseUrl();

		const command = `psql --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --command="SELECT 1;"`;
		const env = { ...process.env, PGPASSWORD: dbConfig.password };

		try {
			await execAsync(command, { env });
			console.log(`✅ Database connection successful`);
			return true;
		} catch (error) {
			console.error("❌ Database connection failed:", error);
			return false;
		}
	}
}

// CLI interface
async function main() {
	const restore = new DatabaseRestore();

	const command = process.argv[2];
	const backupFile = process.argv[3];
	const options = process.argv[4];

	try {
		switch (command) {
			case "list":
				const backups = await restore.listAvailableBackups();
				console.log("📋 Available backups:");
				backups.forEach((backup) => {
					console.log(
						`  ${backup.filename} (${backup.size}) - ${backup.modified.toLocaleDateString()}`
					);
				});
				break;

			case "test":
				await restore.testConnection();
				break;

			case "full":
				if (!backupFile) {
					console.error(
						'❌ Please specify backup file: npm run restore:full "backup-file.backup"'
					);
					process.exit(1);
				}
				await restore.restoreFullBackup(backupFile);
				break;

			case "schema":
				if (!backupFile) {
					console.error(
						'❌ Please specify backup file: npm run restore:schema "backup-file.sql"'
					);
					process.exit(1);
				}
				await restore.restoreSchemaOnly(backupFile);
				break;

			case "data":
				if (!backupFile) {
					console.error(
						'❌ Please specify backup file: npm run restore:data "backup-file.sql"'
					);
					process.exit(1);
				}
				await restore.restoreDataOnly(backupFile);
				break;

			case "tables":
				if (!backupFile || !options) {
					console.error(
						'❌ Please specify backup file and tables: npm run restore:tables "backup-file.sql" "table1,table2"'
					);
					process.exit(1);
				}
				const tables = options.split(",");
				await restore.restoreTables(backupFile, tables);
				break;

			case "create-db":
				if (!backupFile) {
					console.error(
						'❌ Please specify database name: npm run restore:create-db "database-name"'
					);
					process.exit(1);
				}
				await restore.createDatabase(backupFile);
				break;

			case "drop-db":
				if (!backupFile) {
					console.error(
						'❌ Please specify database name: npm run restore:drop-db "database-name"'
					);
					process.exit(1);
				}
				await restore.dropDatabase(backupFile);
				break;

			default:
				console.log(`
🔄 Database Restore Tool

Usage:
  npm run restore:list                    - List available backups
  npm run restore:test                    - Test database connection
  npm run restore:full "backup.backup"    - Restore full backup
  npm run restore:schema "backup.sql"     - Restore schema only
  npm run restore:data "backup.sql"       - Restore data only
  npm run restore:tables "backup.sql" "table1,table2" - Restore specific tables
  npm run restore:create-db "dbname"      - Create new database
  npm run restore:drop-db "dbname"        - Drop database

Environment Variables:
  DATABASE_URL     - Your PostgreSQL connection string
  BACKUP_DIR       - Backup directory (default: ./backups)

⚠️  WARNING: Restore operations can overwrite existing data!
        `);
		}
	} catch (error) {
		console.error("❌ Restore failed:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

export { DatabaseRestore };
