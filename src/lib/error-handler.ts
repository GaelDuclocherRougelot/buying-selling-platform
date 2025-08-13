import { toast } from "sonner";

export interface AppError {
	message: string;
	code?: string;
	status?: number;
	details?: unknown;
	timestamp: Date;
	userId?: string;
	path?: string;
}

export interface ErrorConfig {
	showToast?: boolean;
	logToConsole?: boolean;
	logToServer?: boolean;
	fallbackMessage?: string;
}

interface ErrorLike {
	message?: string;
	error?: string;
	code?: string | number;
	status?: number;
	details?: unknown;
}

export class ErrorHandler {
	private static instance: ErrorHandler;
	private errorLog: AppError[] = [];
	private readonly maxLogSize = 100;

	private constructor() {}

	static getInstance(): ErrorHandler {
		if (!ErrorHandler.instance) {
			ErrorHandler.instance = new ErrorHandler();
		}
		return ErrorHandler.instance;
	}

	/**
	 * Gère une erreur avec configuration personnalisée
	 */
	handleError(
		error: Error | string | unknown,
		config: ErrorConfig = {}
	): AppError {
		const {
			showToast = true,
			logToConsole = true,
			logToServer = false,
			fallbackMessage = "Une erreur inattendue s'est produite",
		} = config;

		// Normaliser l'erreur
		const appError: AppError = this.normalizeError(error, fallbackMessage);

		// Afficher le toast si demandé
		if (showToast) {
			this.showErrorToast(appError);
		}

		// Logger dans la console si demandé
		if (logToConsole) {
			this.logToConsole(appError);
		}

		// Logger sur le serveur si demandé
		if (logToServer) {
			this.logToServer(appError);
		}

		// Ajouter à l'historique local
		this.addToLog(appError);

		return appError;
	}

	/**
	 * Gère une erreur API avec gestion automatique des codes de statut
	 */
	handleApiError(response: Response, fallbackMessage?: string): AppError {
		const status = response.status;
		let message = fallbackMessage || "Erreur lors de la requête";

		// Messages d'erreur personnalisés selon le code de statut
		switch (status) {
			case 400:
				message = "Requête invalide";
				break;
			case 401:
				message = "Vous devez être connecté";
				break;
			case 403:
				message = "Accès refusé";
				break;
			case 404:
				message = "Ressource non trouvée";
				break;
			case 409:
				message = "Conflit de données";
				break;
			case 422:
				message = "Données invalides";
				break;
			case 429:
				message = "Trop de requêtes, veuillez patienter";
				break;
			case 500:
				message = "Erreur interne du serveur";
				break;
			case 502:
			case 503:
			case 504:
				message = "Service temporairement indisponible";
				break;
		}

		const appError: AppError = {
			message,
			code: `HTTP_${status}`,
			status,
			timestamp: new Date(),
			path:
				typeof window !== "undefined"
					? window.location.pathname
					: undefined,
		};

		this.handleError(appError, {
			showToast: true,
			logToConsole: true,
			logToServer: status >= 500,
		});

		return appError;
	}

	/**
	 * Gère une erreur de validation
	 */
	handleValidationError(
		errors: unknown[],
		fallbackMessage = "Données invalides"
	): AppError {
		const appError: AppError = {
			message: fallbackMessage,
			code: "VALIDATION_ERROR",
			details: errors,
			timestamp: new Date(),
		};

		this.handleError(appError, {
			showToast: true,
			logToConsole: true,
		});

		return appError;
	}

	/**
	 * Gère une erreur d'authentification
	 */
	handleAuthError(error: Error | string, redirectToLogin = true): AppError {
		const appError: AppError = {
			message: typeof error === "string" ? error : error.message,
			code: "AUTH_ERROR",
			timestamp: new Date(),
		};

		this.handleError(appError, {
			showToast: true,
			logToConsole: true,
		});

		if (redirectToLogin && typeof window !== "undefined") {
			// Rediriger vers la page de connexion après un délai
			setTimeout(() => {
				window.location.href = "/auth/login";
			}, 2000);
		}

		return appError;
	}

	/**
	 * Normalise une erreur en AppError
	 */
	private normalizeError(
		error: Error | string | unknown,
		fallbackMessage: string
	): AppError {
		if (typeof error === "string") {
			return {
				message: error,
				timestamp: new Date(),
			};
		}

		if (error instanceof Error) {
			return {
				message: error.message || fallbackMessage,
				code: error.name,
				details: error.stack,
				timestamp: new Date(),
			};
		}

		// Erreur avec structure personnalisée
		if (error && typeof error === "object") {
			const errorLike = error as ErrorLike;
			return {
				message:
					errorLike.message || errorLike.error || fallbackMessage,
				code:
					(errorLike.code || errorLike.status)?.toString() ||
					undefined,
				status: errorLike.status,
				details: errorLike.details || error,
				timestamp: new Date(),
			};
		}

		return {
			message: fallbackMessage,
			timestamp: new Date(),
		};
	}

	/**
	 * Affiche un toast d'erreur
	 */
	private showErrorToast(error: AppError): void {
		const description = error.details
			? typeof error.details === "string"
				? error.details
				: JSON.stringify(error.details)
			: undefined;

		toast.error(error.message, {
			description:
				description && description.length > 100
					? description.substring(0, 100) + "..."
					: description,
		});
	}

	/**
	 * Log l'erreur dans la console
	 */
	private logToConsole(error: AppError): void {
		console.group(`🚨 Erreur: ${error.message}`);
		console.error("Code:", error.code);
		console.error("Status:", error.status);
		console.error("Timestamp:", error.timestamp);
		console.error("Path:", error.path);
		if (error.details) {
			console.error("Details:", error.details);
		}
		console.groupEnd();
	}

	/**
	 * Envoie l'erreur au serveur pour logging
	 */
	private async logToServer(error: AppError): Promise<void> {
		try {
			await fetch("/api/error-log", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(error),
			});
		} catch (logError) {
			console.error("Failed to log error to server:", logError);
		}
	}

	/**
	 * Ajoute l'erreur à l'historique local
	 */
	private addToLog(error: AppError): void {
		this.errorLog.push(error);

		// Limiter la taille du log
		if (this.errorLog.length > this.maxLogSize) {
			this.errorLog = this.errorLog.slice(-this.maxLogSize);
		}
	}

	/**
	 * Récupère l'historique des erreurs
	 */
	getErrorLog(): AppError[] {
		return [...this.errorLog];
	}

	/**
	 * Vide l'historique des erreurs
	 */
	clearErrorLog(): void {
		this.errorLog = [];
	}

	/**
	 * Vérifie si une erreur est récupérable
	 */
	isRecoverableError(error: AppError): boolean {
		const nonRecoverableCodes = [
			"AUTH_ERROR",
			"VALIDATION_ERROR",
			"HTTP_401",
			"HTTP_403",
			"HTTP_404",
		];

		return !nonRecoverableCodes.includes(error.code || "");
	}
}

// Instance singleton
export const errorHandler = ErrorHandler.getInstance();

// Fonctions utilitaires pour une utilisation plus simple
export const handleError = (
	error: Error | string | unknown,
	config?: ErrorConfig
) => errorHandler.handleError(error, config);

export const handleApiError = (response: Response, fallbackMessage?: string) =>
	errorHandler.handleApiError(response, fallbackMessage);

export const handleValidationError = (
	errors: unknown[],
	fallbackMessage?: string
) => errorHandler.handleValidationError(errors, fallbackMessage);

export const handleAuthError = (
	error: Error | string,
	redirectToLogin?: boolean
) => errorHandler.handleAuthError(error, redirectToLogin);
