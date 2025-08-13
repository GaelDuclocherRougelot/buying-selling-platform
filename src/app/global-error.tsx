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
import { useEffect } from "react";

interface GlobalErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
	useEffect(() => {
		// Logger l'erreur avec notre gestionnaire global
		errorHandler.handleError(error, {
			showToast: false, // Pas de toast car on affiche déjà l'UI d'erreur
			logToConsole: true,
			logToServer: true,
			fallbackMessage: "Une erreur critique s'est produite",
		});
	}, [error]);

	return (
		<html>
			<body>
				<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
								<AlertTriangle className="h-6 w-6 text-red-600" />
							</div>
							<CardTitle className="text-xl font-semibold text-gray-900">
								Erreur Critique
							</CardTitle>
							<CardDescription className="text-gray-600">
								Une erreur critique s&apos;est produite. Veuillez
								recharger la page.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{process.env.NODE_ENV === "development" && (
								<details className="rounded-lg bg-gray-100 p-3 text-sm">
									<summary className="cursor-pointer font-medium text-gray-700 mb-2">
										Détails de l&apos;erreur (développement)
									</summary>
									<div className="space-y-2 text-xs">
										<div>
											<strong>Message:</strong>{" "}
											{error.message}
										</div>
										{error.digest && (
											<div>
												<strong>Digest:</strong>{" "}
												{error.digest}
											</div>
										)}
										<div>
											<strong>Stack:</strong>
											<pre className="mt-1 whitespace-pre-wrap text-gray-600">
												{error.stack}
											</pre>
										</div>
									</div>
								</details>
							)}

							<div className="flex flex-col space-y-2">
								<Button
									onClick={reset}
									className="w-full"
									variant="default"
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Recharger la page
								</Button>

								<Button
									onClick={() => (window.location.href = "/")}
									variant="outline"
									className="w-full"
								>
									<Home className="mr-2 h-4 w-4" />
									Retour à l&apos;accueil
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</body>
		</html>
	);
}
