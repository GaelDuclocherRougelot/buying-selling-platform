import { useCallback, useRef } from "react";
import {
	errorHandler,
	handleError,
	type AppError,
	type ErrorConfig,
} from "../error-handler";

export interface UseErrorHandlerReturn {
	handleError: (
		error: Error | string | unknown,
		config?: ErrorConfig
	) => AppError;
	handleApiError: (response: Response, fallbackMessage?: string) => AppError;
	handleValidationError: (
		errors: unknown[],
		fallbackMessage?: string
	) => AppError;
	handleAuthError: (
		error: Error | string,
		redirectToLogin?: boolean
	) => AppError;
	getErrorLog: () => AppError[];
	clearErrorLog: () => void;
	isRecoverableError: (error: AppError) => boolean;
}

/**
 * Hook personnalisé pour la gestion d'erreur
 * Fournit des méthodes pour gérer différents types d'erreurs de manière centralisée
 */
export function useErrorHandler(): UseErrorHandlerReturn {
	// Utiliser useRef pour éviter les re-renders inutiles
	const errorHandlerRef = useRef(errorHandler);

	const handleErrorCallback = useCallback(
		(error: Error | string | unknown, config?: ErrorConfig) => {
			return errorHandlerRef.current.handleError(error, config);
		},
		[]
	);

	const handleApiErrorCallback = useCallback(
		(response: Response, fallbackMessage?: string) => {
			return errorHandlerRef.current.handleApiError(
				response,
				fallbackMessage
			);
		},
		[]
	);

	const handleValidationErrorCallback = useCallback(
		(errors: unknown[], fallbackMessage?: string) => {
			return errorHandlerRef.current.handleValidationError(
				errors,
				fallbackMessage
			);
		},
		[]
	);

	const handleAuthErrorCallback = useCallback(
		(error: Error | string, redirectToLogin?: boolean) => {
			return errorHandlerRef.current.handleAuthError(
				error,
				redirectToLogin
			);
		},
		[]
	);

	const getErrorLogCallback = useCallback(() => {
		return errorHandlerRef.current.getErrorLog();
	}, []);

	const clearErrorLogCallback = useCallback(() => {
		errorHandlerRef.current.clearErrorLog();
	}, []);

	const isRecoverableErrorCallback = useCallback((error: AppError) => {
		return errorHandlerRef.current.isRecoverableError(error);
	}, []);

	return {
		handleError: handleErrorCallback,
		handleApiError: handleApiErrorCallback,
		handleValidationError: handleValidationErrorCallback,
		handleAuthError: handleAuthErrorCallback,
		getErrorLog: getErrorLogCallback,
		clearErrorLog: clearErrorLogCallback,
		isRecoverableError: isRecoverableErrorCallback,
	};
}

/**
 * Hook pour gérer les erreurs dans les requêtes fetch
 * Wrapper autour de fetch avec gestion d'erreur automatique
 */
export function useApiErrorHandler() {
	const { handleApiError } = useErrorHandler();

	const safeFetch = useCallback(
		async (
			url: string,
			options?: RequestInit,
			customErrorMessage?: string
		): Promise<Response> => {
			try {
				const response = await fetch(url, options);

				if (!response.ok) {
					handleApiError(response, customErrorMessage);
				}

				return response;
			} catch (error) {
				handleError(error, {
					fallbackMessage:
						customErrorMessage || "Erreur de connexion",
				});
				throw error;
			}
		},
		[handleApiError]
	);

	return { safeFetch };
}

/**
 * Hook pour gérer les erreurs dans les opérations asynchrones
 */
export function useAsyncErrorHandler() {
	const { handleError } = useErrorHandler();

	const withErrorHandling = useCallback(
		async <T>(
			asyncFn: () => Promise<T>,
			errorMessage?: string,
			config?: ErrorConfig
		): Promise<T | null> => {
			try {
				return await asyncFn();
			} catch (error) {
				handleError(error, {
					fallbackMessage:
						errorMessage || "Erreur lors de l'opération",
					...config,
				});
				return null;
			}
		},
		[handleError]
	);

	return { withErrorHandling };
}
