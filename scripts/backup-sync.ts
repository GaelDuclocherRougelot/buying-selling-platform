#!/usr/bin/env tsx

import { exec } from "child_process";
import { config } from "dotenv";
import { promisify } from "util";

// Load environment variables
config();

const execAsync = promisify(exec);

interface SyncConfig {
	localBackupDir: string;
	remoteServer: string;
	remoteBackupDir: string;
	sshUser: string;
	sshKeyPath?: string;
	retentionDays: number;
	compression: boolean;
}

class BackupSync {
	private config: SyncConfig;

	constructor(config: SyncConfig) {
		this.config = config;
	}

	private async executeSSHCommand(command: string): Promise<string> {
		const sshOptions = this.config.sshKeyPath
			? `-i ${this.config.sshKeyPath}`
			: "";

		const fullCommand = `ssh ${sshOptions} ${this.config.sshUser}@${this.config.remoteServer} "${command}"`;

		try {
			const { stdout, stderr } = await execAsync(fullCommand);
			if (stderr) {
				console.warn("⚠️  SSH warning:", stderr);
			}
			return stdout;
		} catch (error) {
			console.error("❌ SSH command failed:", error);
			throw error;
		}
	}

	async syncBackups() {
		console.log("🔄 Starting backup synchronization...");

		try {
			// 1. Create remote directory if it doesn't exist
			await this.executeSSHCommand(
				`mkdir -p ${this.config.remoteBackupDir}`
			);

			// 2. Sync local backups to remote server
			const rsyncCommand = `rsync -avz --delete ${this.config.localBackupDir}/ ${this.config.sshUser}@${this.config.remoteServer}:${this.config.remoteBackupDir}/`;

			console.log("📤 Syncing backups to remote server...");
			const { stdout, stderr } = await execAsync(rsyncCommand);

			if (stderr) {
				console.warn("⚠️  Rsync warnings:", stderr);
			}

			console.log("✅ Backup synchronization completed");
			console.log("📊 Sync details:", stdout);

			// 3. Clean up old backups on remote server
			await this.cleanupRemoteBackups();

			return { success: true, output: stdout };
		} catch (error) {
			console.error("❌ Backup synchronization failed:", error);
			throw error;
		}
	}

	async cleanupRemoteBackups() {
		console.log("🧹 Cleaning up old backups on remote server...");

		const cleanupCommand = `find ${this.config.remoteBackupDir} -name "*.backup" -o -name "*.sql" -mtime +${this.config.retentionDays} -delete`;

		try {
			await this.executeSSHCommand(cleanupCommand);
			console.log("✅ Remote cleanup completed");
		} catch (error) {
			console.error("❌ Remote cleanup failed:", error);
		}
	}

	async listRemoteBackups() {
		console.log("📋 Listing remote backups...");

		try {
			const result = await this.executeSSHCommand(
				`ls -la ${this.config.remoteBackupDir}`
			);
			console.log("📁 Remote backups:");
			console.log(result);
			return result;
		} catch (error) {
			console.error("❌ Failed to list remote backups:", error);
			throw error;
		}
	}

	async testConnection() {
		console.log("🔍 Testing remote server connection...");

		try {
			const result = await this.executeSSHCommand(
				'echo "Connection successful"'
			);
			console.log("✅ Remote connection successful");
			return true;
		} catch (error) {
			console.error("❌ Remote connection failed:", error);
			return false;
		}
	}

	async getRemoteBackupStats() {
		console.log("📊 Getting remote backup statistics...");

		try {
			const sizeCommand = `du -sh ${this.config.remoteBackupDir}`;
			const countCommand = `find ${this.config.remoteBackupDir} -name "*.backup" -o -name "*.sql" | wc -l`;

			const [size, count] = await Promise.all([
				this.executeSSHCommand(sizeCommand),
				this.executeSSHCommand(countCommand),
			]);

			console.log(`📈 Remote backup stats:`);
			console.log(`  Total size: ${size.trim()}`);
			console.log(`  File count: ${count.trim()}`);

			return { size: size.trim(), count: count.trim() };
		} catch (error) {
			console.error("❌ Failed to get remote stats:", error);
			throw error;
		}
	}
}

// CLI interface
async function main() {
	const command = process.argv[2];

	// Configuration from environment variables
	const config: SyncConfig = {
		localBackupDir: process.env.BACKUP_DIR || "./backups",
		remoteServer: process.env.BACKUP_REMOTE_SERVER || "",
		remoteBackupDir: process.env.BACKUP_REMOTE_DIR || "/secure/backups",
		sshUser: process.env.BACKUP_SSH_USER || "",
		sshKeyPath: process.env.BACKUP_SSH_KEY,
		retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || "30"),
		compression: true,
	};

	if (!config.remoteServer || !config.sshUser) {
		console.error("❌ Missing configuration. Please set:");
		console.error("  BACKUP_REMOTE_SERVER - Remote server hostname/IP");
		console.error("  BACKUP_SSH_USER - SSH username");
		console.error("  BACKUP_SSH_KEY - SSH key path (optional)");
		console.error("  BACKUP_REMOTE_DIR - Remote backup directory");
		process.exit(1);
	}

	const sync = new BackupSync(config);

	try {
		switch (command) {
			case "sync":
				await sync.syncBackups();
				break;

			case "list":
				await sync.listRemoteBackups();
				break;

			case "stats":
				await sync.getRemoteBackupStats();
				break;

			case "test":
				await sync.testConnection();
				break;

			case "cleanup":
				await sync.cleanupRemoteBackups();
				break;

			default:
				console.log(`
🔄 Backup Sync Tool (V2)

Usage:
  npm run backup:sync:sync      - Sync local backups to remote server
  npm run backup:sync:list      - List remote backups
  npm run backup:sync:stats     - Get remote backup statistics
  npm run backup:sync:test      - Test remote connection
  npm run backup:sync:cleanup   - Clean up old remote backups

Environment Variables:
  BACKUP_REMOTE_SERVER    - Remote server hostname/IP
  BACKUP_SSH_USER         - SSH username
  BACKUP_SSH_KEY          - SSH key path (optional)
  BACKUP_REMOTE_DIR       - Remote backup directory
  BACKUP_RETENTION_DAYS   - Days to keep backups (default: 30)
        `);
		}
	} catch (error) {
		console.error("❌ Sync operation failed:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

export { BackupSync };
