"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { errorHandler } from "@/lib/error-handler";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		// Met à jour l'état pour que le prochain rendu affiche l'UI de fallback
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log l'erreur
		console.error("ErrorBoundary caught an error:", error, errorInfo);

		// Utiliser le gestionnaire d'erreur global
		errorHandler.handleError(error, {
			showToast: false, // Pas de toast car on affiche déjà l'UI d'erreur
			logToConsole: true,
			logToServer: true,
			fallbackMessage: "Une erreur inattendue s'est produite",
		});

		// Appeler le callback personnalisé si fourni
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// Mettre à jour l'état avec les détails de l'erreur
		this.setState({ error, errorInfo });
	}

	handleRetry = () => {
		this.setState({
			hasError: false,
			error: undefined,
			errorInfo: undefined,
		});
	};

	render() {
		if (this.state.hasError) {
			// UI de fallback personnalisée
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// UI de fallback par défaut
			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
								<AlertTriangle className="h-6 w-6 text-red-600" />
							</div>
							<CardTitle className="text-xl font-semibold text-gray-900">
								Oups ! Quelque chose s&apos;est mal passé
							</CardTitle>
							<CardDescription className="text-gray-600">
								Une erreur inattendue s&apos;est produite. Veuillez
								réessayer.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{process.env.NODE_ENV === "development" &&
								this.state.error && (
									<details className="rounded-lg bg-gray-100 p-3 text-sm">
										<summary className="cursor-pointer font-medium text-gray-700 mb-2">
											Détails de l&apos;erreur (développement)
										</summary>
										<div className="space-y-2 text-xs">
											<div>
												<strong>Message:</strong>{" "}
												{this.state.error.message}
											</div>
											<div>
												<strong>Stack:</strong>
												<pre className="mt-1 whitespace-pre-wrap text-gray-600">
													{this.state.error.stack}
												</pre>
											</div>
											{this.state.errorInfo && (
												<div>
													<strong>
														Component Stack:
													</strong>
													<pre className="mt-1 whitespace-pre-wrap text-gray-600">
														{
															this.state.errorInfo
																.componentStack
														}
													</pre>
												</div>
											)}
										</div>
									</details>
								)}

							<div className="flex flex-col space-y-2">
								<Button
									onClick={this.handleRetry}
									className="w-full"
									variant="default"
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Réessayer
								</Button>

								<Button
									asChild
									variant="outline"
									className="w-full"
								>
									<Link href="/">
										<Home className="mr-2 h-4 w-4" />
										Retour à l&apos;accueil
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			);
		}

		return this.props.children;
	}
}

// Composant de fallback simple pour les erreurs non critiques
export function SimpleErrorFallback({
	error,
	resetErrorBoundary,
}: {
	error: Error;
	resetErrorBoundary: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center p-8 text-center">
			<AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
			<h2 className="text-lg font-semibold text-gray-900 mb-2">
				Une erreur s&apos;est produite
			</h2>
			<p className="text-gray-600 mb-4">
				{error.message || "Une erreur inattendue s'est produite"}
			</p>
			<Button onClick={resetErrorBoundary} variant="outline">
				Réessayer
			</Button>
		</div>
	);
}

// HOC pour wrapper un composant avec ErrorBoundary
export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	fallback?: ReactNode,
	onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
	const WrappedComponent = (props: P) => (
		<ErrorBoundary fallback={fallback} onError={onError}>
			<Component {...props} />
		</ErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

	return WrappedComponent;
}
