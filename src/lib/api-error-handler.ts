import { NextResponse } from "next/server";
import { errorHandler } from "./error-handler";

/**
 * Interface pour les erreurs API
 */
export interface ApiError {
	message: string;
	code?: string;
	status: number;
	details?: unknown;
}

/**
 * Classe utilitaire pour la gestion d'erreur des routes API
 */
export class ApiErrorHandler {
	/**
	 * Créer une réponse d'erreur standardisée
	 */
	static createErrorResponse(
		error: Error | string | unknown,
		status: number = 500,
		code?: string,
		details?: unknown
	): NextResponse<ApiError> {
		const message = error instanceof Error ? error.message : String(error);

		// Logger l'erreur côté serveur
		errorHandler.handleError(error, {
			showToast: false,
			logToConsole: true,
			logToServer: true,
			fallbackMessage: message,
		});

		const errorResponse: ApiError = {
			message,
			status,
			code,
			details,
		};

		return NextResponse.json(errorResponse, { status });
	}

	/**
	 * Gérer les erreurs de validation
	 */
	static createValidationErrorResponse(
		errors: unknown[],
		message: string = "Données invalides"
	): NextResponse<ApiError> {
		return this.createErrorResponse(
			new Error(message),
			422,
			"VALIDATION_ERROR",
			{ errors }
		);
	}

	/**
	 * Gérer les erreurs d'authentification
	 */
	static createAuthErrorResponse(
		message: string = "Vous devez être connecté",
		code: string = "UNAUTHORIZED"
	): NextResponse<ApiError> {
		return this.createErrorResponse(new Error(message), 401, code);
	}

	/**
	 * Gérer les erreurs d'autorisation
	 */
	static createForbiddenErrorResponse(
		message: string = "Accès refusé",
		code: string = "FORBIDDEN"
	): NextResponse<ApiError> {
		return this.createErrorResponse(new Error(message), 403, code);
	}

	/**
	 * Gérer les erreurs de ressource non trouvée
	 */
	static createNotFoundErrorResponse(
		message: string = "Ressource non trouvée",
		code: string = "NOT_FOUND"
	): NextResponse<ApiError> {
		return this.createErrorResponse(new Error(message), 404, code);
	}

	/**
	 * Gérer les erreurs de conflit
	 */
	static createConflictErrorResponse(
		message: string = "Conflit de données",
		code: string = "CONFLICT"
	): NextResponse<ApiError> {
		return this.createErrorResponse(new Error(message), 409, code);
	}

	/**
	 * Gérer les erreurs de limite de taux
	 */
	static createRateLimitErrorResponse(
		message: string = "Trop de requêtes",
		code: string = "RATE_LIMIT_EXCEEDED"
	): NextResponse<ApiError> {
		return this.createErrorResponse(new Error(message), 429, code);
	}

	/**
	 * Gérer les erreurs internes du serveur
	 */
	static createInternalErrorResponse(
		error: Error | string | unknown,
		code: string = "INTERNAL_SERVER_ERROR"
	): NextResponse<ApiError> {
		return this.createErrorResponse(error, 500, code);
	}

	/**
	 * Gérer les erreurs de service indisponible
	 */
	static createServiceUnavailableErrorResponse(
		message: string = "Service temporairement indisponible",
		code: string = "SERVICE_UNAVAILABLE"
	): NextResponse<ApiError> {
		return this.createErrorResponse(new Error(message), 503, code);
	}

	/**
	 * Wrapper pour gérer les erreurs dans les routes API
	 */
	static async handleApiRoute<T>(
		handler: () => Promise<T>,
	): Promise<NextResponse<T> | NextResponse<ApiError>> {
		try {
			const result = await handler();
			return NextResponse.json(result);
		} catch (error) {
			console.error("Erreur dans la route API:", error);

			// Si c'est déjà une réponse d'erreur, la retourner
			if (error instanceof NextResponse) {
				return error;
			}

			// Créer une réponse d'erreur appropriée
			if (error instanceof Error) {
				// Erreurs connues avec des codes spécifiques
				if (
					error.message.includes("validation") ||
					error.message.includes("invalide")
				) {
					return this.createValidationErrorResponse(
						[],
						error.message
					);
				}

				if (
					error.message.includes("non trouvé") ||
					error.message.includes("not found")
				) {
					return this.createNotFoundErrorResponse(error.message);
				}

				if (
					error.message.includes("accès") ||
					error.message.includes("autorisation")
				) {
					return this.createForbiddenErrorResponse(error.message);
				}
			}

			// Erreur générique
			return this.createInternalErrorResponse(error, "INTERNAL_ERROR");
		}
	}
}

// Export des fonctions utilitaires pour un usage direct
export const {
	createErrorResponse,
	createValidationErrorResponse,
	createAuthErrorResponse,
	createForbiddenErrorResponse,
	createNotFoundErrorResponse,
	createConflictErrorResponse,
	createRateLimitErrorResponse,
	createInternalErrorResponse,
	createServiceUnavailableErrorResponse,
	handleApiRoute,
} = ApiErrorHandler;
