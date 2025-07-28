import { prisma } from "@/lib/prisma";
import type {
	CreateLoginLogData,
	LoginLog,
	LoginLogFilters,
} from "@/types/login-log";
import type { Prisma } from "@prisma/client";

export class LoginLogService {
	/**
	 * Créer un nouveau log de connexion
	 */
	static async create(data: CreateLoginLogData): Promise<LoginLog> {
		const log = await prisma.loginLog.create({
			data: {
				userId: data.userId,
				action: data.action,
				ipAddress: data.ipAddress,
				userAgent: data.userAgent,
				location: data.location,
				success: data.success ?? true,
				failureReason: data.failureReason,
			},
		});

		return log as unknown as LoginLog;
	}

	/**
	 * Récupérer les logs de connexion avec filtres
	 */
	static async findMany(filters: LoginLogFilters = {}): Promise<LoginLog[]> {
		const where: Prisma.LoginLogWhereInput = {};

		if (filters.userId) {
			where.userId = filters.userId;
		}

		if (filters.action) {
			where.action = filters.action;
		}

		if (filters.success !== undefined) {
			where.success = filters.success;
		}

		if (filters.startDate || filters.endDate) {
			where.createdAt = {};
			if (filters.startDate) {
				where.createdAt.gte = filters.startDate;
			}
			if (filters.endDate) {
				where.createdAt.lte = filters.endDate;
			}
		}

		const logs = await prisma.loginLog.findMany({
			where,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: filters.limit ?? 50,
			skip: filters.offset ?? 0,
		});

		return logs as unknown as LoginLog[];
	}

	/**
	 * Récupérer un log par ID
	 */
	static async findById(id: string): Promise<LoginLog | null> {
		const log = await prisma.loginLog.findUnique({
			where: { id },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
					},
				},
			},
		});

		return log as unknown as LoginLog | null;
	}

	/**
	 * Récupérer les logs d'un utilisateur spécifique
	 */
	static async findByUserId(userId: string, limit = 20): Promise<LoginLog[]> {
		const logs = await prisma.loginLog.findMany({
			where: { userId },
			orderBy: {
				createdAt: "desc",
			},
			take: limit,
		});

		return logs as unknown as LoginLog[];
	}

	/**
	 * Récupérer les tentatives de connexion échouées récentes
	 */
	static async getRecentFailedLogins(
		userId: string,
		hours = 24
	): Promise<LoginLog[]> {
		const cutoffDate = new Date();
		cutoffDate.setHours(cutoffDate.getHours() - hours);

		const logs = await prisma.loginLog.findMany({
			where: {
				userId,
				action: "failed_login",
				createdAt: {
					gte: cutoffDate,
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return logs as unknown as LoginLog[];
	}

	/**
	 * Compter les tentatives de connexion échouées récentes
	 */
	static async countRecentFailedLogins(
		userId: string,
		hours = 24
	): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setHours(cutoffDate.getHours() - hours);

		const count = await prisma.loginLog.count({
			where: {
				userId,
				action: "failed_login",
				createdAt: {
					gte: cutoffDate,
				},
			},
		});

		return count;
	}

	/**
	 * Supprimer les anciens logs (nettoyage)
	 */
	static async deleteOldLogs(daysOld = 90): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysOld);

		const result = await prisma.loginLog.deleteMany({
			where: {
				createdAt: {
					lt: cutoffDate,
				},
			},
		});

		return result.count;
	}

	/**
	 * Obtenir des statistiques de connexion
	 */
	static async getLoginStats(
		userId?: string,
		days = 30
	): Promise<{
		totalLogins: number;
		successfulLogins: number;
		failedLogins: number;
		uniqueIPs: number;
	}> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		const where: Prisma.LoginLogWhereInput = {
			createdAt: {
				gte: cutoffDate,
			},
		};

		if (userId) {
			where.userId = userId;
		}

		const [totalLogins, successfulLogins, failedLogins, allLogs] =
			await Promise.all([
				prisma.loginLog.count({
					where: { ...where, action: "login" },
				}),
				prisma.loginLog.count({
					where: { ...where, action: "login", success: true },
				}),
				prisma.loginLog.count({
					where: { ...where, action: "failed_login" },
				}),
				prisma.loginLog.findMany({
					where: { ...where, action: "login" },
					select: { ipAddress: true },
				}),
			]);

		// Compter les IPs uniques manuellement
		const uniqueIPs = new Set(
			allLogs
				.map((log) => log.ipAddress)
				.filter((ip) => ip && ip !== "unknown")
		).size;

		return {
			totalLogins,
			successfulLogins,
			failedLogins,
			uniqueIPs,
		};
	}
}
