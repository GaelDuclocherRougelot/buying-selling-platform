"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { AlertTriangle, Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ErrorLog {
	id: string;
	message: string;
	code?: string;
	status?: number;
	path?: string;
	userId?: string;
	userAgent?: string;
	ip?: string;
	details?: Record<string, unknown>;
	timestamp: string;
	createdAt: string;
	user?: {
		id: string;
		name: string;
		email: string;
		username?: string;
	};
}

export default function ErrorLogsPage() {
	const { data: session } = useSession();
	const router = useRouter();
	const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [showDetails, setShowDetails] = useState(false);

	useEffect(() => {
		if (session?.user?.role !== "admin") {
			router.push("/admin/login");
			return;
		}
		fetchErrorLogs();
	}, [session, router]);

	const fetchErrorLogs = async () => {
		try {
			setLoading(true);
			const response = await apiFetch("/api/error-log");

			if (response.ok) {
				const data = await response.json();
				setErrorLogs(data.data || []);
			} else {
				toast.error("Erreur lors du chargement des logs d'erreur");
			}
		} catch (error) {
			console.error("Erreur:", error);
			toast.error("Erreur lors du chargement des logs d'erreur");
		} finally {
			setLoading(false);
		}
	};

	const deleteErrorLog = async (id: string) => {
		try {
			const response = await apiFetch(`/api/error-log?id=${id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Log d'erreur supprimé");
				fetchErrorLogs(); // Recharger la liste
			} else {
				toast.error("Erreur lors de la suppression");
			}
		} catch (error) {
			console.error("Erreur:", error);
			toast.error("Erreur lors de la suppression");
		}
	};

	const clearAllLogs = async () => {
		if (
			!confirm(
				"Êtes-vous sûr de vouloir supprimer tous les logs d'erreur ?"
			)
		) {
			return;
		}

		try {
			const response = await apiFetch("/api/error-log", {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Tous les logs d'erreur ont été supprimés");
				setErrorLogs([]);
			} else {
				toast.error("Erreur lors de la suppression");
			}
		} catch (error) {
			console.error("Erreur:", error);
			toast.error("Erreur lors de la suppression");
		}
	};

	const getStatusColor = (status?: number) => {
		if (!status) return "bg-gray-500";
		if (status >= 500) return "bg-red-500";
		if (status >= 400) return "bg-orange-500";
		if (status >= 300) return "bg-blue-500";
		return "bg-green-500";
	};

	const getStatusText = (status?: number) => {
		if (!status) return "N/A";
		if (status >= 500) return "Erreur Serveur";
		if (status >= 400) return "Erreur Client";
		if (status >= 300) return "Redirection";
		return "Succès";
	};

	if (session?.user?.role !== "admin") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Accès Refusé</CardTitle>
						<CardDescription>
							Vous devez être administrateur pour accéder à cette
							page.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Logs d&apos;Erreur
					</h1>
					<p className="text-gray-600">
						Surveillez et gérez les erreurs de l&apos;application
					</p>
				</div>

				<div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
					<div className="flex items-center gap-4">
						<Button
							onClick={fetchErrorLogs}
							disabled={loading}
							variant="outline"
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
							/>
							Actualiser
						</Button>

						<Button
							onClick={() => setShowDetails(!showDetails)}
							variant="outline"
						>
							{showDetails ? (
								<EyeOff className="h-4 w-4 mr-2" />
							) : (
								<Eye className="h-4 w-4 mr-2" />
							)}
							{showDetails ? "Masquer" : "Afficher"} les détails
						</Button>
					</div>

					<Button
						onClick={clearAllLogs}
						variant="destructive"
						disabled={errorLogs.length === 0}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Vider tous les logs
					</Button>
				</div>

				{loading ? (
					<Card>
						<CardContent className="py-12">
							<div className="text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
								<p className="text-gray-600">
									Chargement des logs d&apos;erreur...
								</p>
							</div>
						</CardContent>
					</Card>
				) : errorLogs.length === 0 ? (
					<Card>
						<CardContent className="py-12">
							<div className="text-center">
								<AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									Aucun log d&apos;erreur
								</h3>
								<p className="text-gray-600">
									Aucune erreur n&apos;a été enregistrée pour le
									moment.
								</p>
							</div>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						{errorLogs.map((log) => (
							<Card key={log.id} className="overflow-hidden">
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
												<CardTitle className="text-lg">
													{log.message}
												</CardTitle>
											</div>

											<div className="flex flex-wrap gap-2">
												{log.code && (
													<Badge variant="secondary">
														{log.code}
													</Badge>
												)}
												{log.status && (
													<Badge
														className={getStatusColor(
															log.status
														)}
													>
														{getStatusText(
															log.status
														)}{" "}
														({log.status})
													</Badge>
												)}
												{log.path && (
													<Badge variant="outline">
														{log.path}
													</Badge>
												)}
											</div>
										</div>

										<Button
											onClick={() =>
												deleteErrorLog(log.id)
											}
											variant="ghost"
											size="sm"
											className="text-red-600 hover:text-red-700 hover:bg-red-50"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>

								<CardContent className="pt-0">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
										<div>
											<span className="font-medium text-gray-700">
												Utilisateur:
											</span>
											{log.user ? (
												<div className="ml-2">
													<div>{log.user.name}</div>
													<div className="text-gray-500">
														{log.user.email}
													</div>
													{log.user.username && (
														<div className="text-gray-500">
															@{log.user.username}
														</div>
													)}
												</div>
											) : (
												<span className="ml-2 text-gray-500">
													Non connecté
												</span>
											)}
										</div>

										<div>
											<span className="font-medium text-gray-700">
												IP:
											</span>
											<span className="ml-2 text-gray-600">
												{log.ip || "N/A"}
											</span>
										</div>

										<div>
											<span className="font-medium text-gray-700">
												Date:
											</span>
											<span className="ml-2 text-gray-600">
												{new Date(
													log.timestamp
												).toLocaleString("fr-FR")}
											</span>
										</div>

										<div>
											<span className="font-medium text-gray-700">
												User-Agent:
											</span>
											<span className="ml-2 text-gray-600 text-xs">
												{log.userAgent
													? log.userAgent.length > 50
														? log.userAgent.substring(
																0,
																50
															) + "..."
														: log.userAgent
													: "N/A"}
											</span>
										</div>
									</div>

									{showDetails && log.details && (
										<div className="mt-4 pt-4 border-t border-gray-200">
											<span className="font-medium text-gray-700 block mb-2">
												Détails:
											</span>
											<pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
												{JSON.stringify(
													log.details,
													null,
													2
												)}
											</pre>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{errorLogs.length > 0 && (
					<div className="mt-6 text-center text-sm text-gray-500">
						{errorLogs.length} erreur(s) affichée(s)
					</div>
				)}
			</div>
		</div>
	);
}
