import type { LoginAction } from "@/types/login-log";

interface LogLoginOptions {
	action: LoginAction;
	userId: string;
	ipAddress?: string;
	userAgent?: string;
	location?: string;
	success?: boolean;
	failureReason?: string;
}

/**
 * Utilitaire pour logger les connexions des utilisateurs
 */
export class LoginLogger {
	/**
	 * Logger une action de connexion
	 */
	static async logLogin(options: LogLoginOptions): Promise<void> {
		try {
			const response = await fetch("/api/login-logs", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					action: options.action,
					ipAddress: options.ipAddress,
					userAgent: options.userAgent,
					location: options.location,
					success: options.success ?? true,
					failureReason: options.failureReason,
				}),
			});

			if (!response.ok) {
				console.error(
					"Erreur lors du logging de connexion:",
					await response.text()
				);
			}
		} catch (error) {
			console.error("Erreur lors du logging de connexion:", error);
		}
	}

	/**
	 * Logger une connexion réussie
	 */
	static async logSuccessfulLogin(
		userId: string,
		ipAddress?: string,
		userAgent?: string,
		location?: string
	): Promise<void> {
		await this.logLogin({
			action: "login",
			userId,
			ipAddress,
			userAgent,
			location,
			success: true,
		});
	}

	/**
	 * Logger une tentative de connexion échouée
	 */
	static async logFailedLogin(
		userId: string,
		failureReason: string,
		ipAddress?: string,
		userAgent?: string,
		location?: string
	): Promise<void> {
		await this.logLogin({
			action: "failed_login",
			userId,
			ipAddress,
			userAgent,
			location,
			success: false,
			failureReason,
		});
	}

	/**
	 * Logger une déconnexion
	 */
	static async logLogout(
		userId: string,
		ipAddress?: string,
		userAgent?: string,
		location?: string
	): Promise<void> {
		await this.logLogin({
			action: "logout",
			userId,
			ipAddress,
			userAgent,
			location,
			success: true,
		});
	}

	/**
	 * Logger une réinitialisation de mot de passe
	 */
	static async logPasswordReset(
		userId: string,
		ipAddress?: string,
		userAgent?: string,
		location?: string
	): Promise<void> {
		await this.logLogin({
			action: "password_reset",
			userId,
			ipAddress,
			userAgent,
			location,
			success: true,
		});
	}

	/**
	 * Logger un verrouillage de compte
	 */
	static async logAccountLocked(
		userId: string,
		reason: string,
		ipAddress?: string,
		userAgent?: string,
		location?: string
	): Promise<void> {
		await this.logLogin({
			action: "account_locked",
			userId,
			ipAddress,
			userAgent,
			location,
			success: false,
			failureReason: reason,
		});
	}
}

/**
 * Hook pour obtenir les informations de connexion depuis les headers
 */
export function getConnectionInfo(headers: Headers) {
	// Try multiple IP header variations
	const ipAddress =
		headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		headers.get("x-real-ip") ||
		headers.get("cf-connecting-ip") ||
		headers.get("x-client-ip") ||
		headers.get("x-forwarded") ||
		headers.get("forwarded-for") ||
		headers.get("forwarded") ||
		"unknown";

	const userAgent = headers.get("user-agent") || "unknown";

	return { ipAddress, userAgent };
}
