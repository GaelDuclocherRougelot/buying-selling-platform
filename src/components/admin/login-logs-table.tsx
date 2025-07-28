"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { LoginAction, LoginLog } from "@/types/login-log";
import { useEffect, useState } from "react";

interface LoginLogsTableProps {
	initialLogs?: LoginLog[];
}

export function LoginLogsTable({ initialLogs = [] }: LoginLogsTableProps) {
	const [logs, setLogs] = useState<LoginLog[]>(initialLogs);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState({
		userId: "",
		action: "" as LoginAction | "",
		success: "" as string,
		limit: "50",
		offset: "0",
	});

	useEffect(() => {
		const fetchLogs = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				if (filters.userId) params.append("userId", filters.userId);
				if (filters.action) params.append("action", filters.action);
				if (filters.success) params.append("success", filters.success);
				if (filters.limit) params.append("limit", filters.limit);
				if (filters.offset) params.append("offset", filters.offset);

				const response = await fetch(`/api/admin/login-logs?${params}`);
				if (response.ok) {
					const data = await response.json();
					setLogs(data.logs);
				}
			} catch (error) {
				console.error("Erreur lors du chargement des logs:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchLogs();
	}, [filters]);

	const getActionBadgeVariant = (action: LoginAction) => {
		switch (action) {
			case "login":
				return "default";
			case "logout":
				return "secondary";
			case "failed_login":
				return "destructive";
			case "password_reset":
				return "outline";
			case "account_locked":
				return "destructive";
			default:
				return "outline";
		}
	};

	const formatDate = (date: string | Date) => {
		return new Date(date).toLocaleString("fr-FR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleFilterChange = (key: string, value: string) => {
		setFilters((prev) => ({ ...prev, [key]: value, offset: "0" }));
	};

	const handlePageChange = (newOffset: number) => {
		setFilters((prev) => ({ ...prev, offset: newOffset.toString() }));
	};

	const getActionLabel = (action: LoginAction) => {
		switch (action) {
			case "login":
				return "Connexion";
			case "logout":
				return "Déconnexion";
			case "failed_login":
				return "Échec de connexion";
			case "password_reset":
				return "Réinitialisation mot de passe";
			case "account_locked":
				return "Compte verrouillé";
			default:
				return action;
		}
	};

	const getActionDisplayText = () => {
		return filters.action
			? getActionLabel(filters.action as LoginAction)
			: "Toutes les actions";
	};

	const getSuccessDisplayText = () => {
		if (filters.success === "true") return "Réussi";
		if (filters.success === "false") return "Échoué";
		return "Tous les statuts";
	};

	const getLimitDisplayText = () => {
		return filters.limit;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Logs de connexion</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Filtres */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
					<div>
						<Label htmlFor="userId">ID Utilisateur</Label>
						<Input
							id="userId"
							value={filters.userId}
							onChange={(e) =>
								handleFilterChange("userId", e.target.value)
							}
							placeholder="Filtrer par utilisateur"
						/>
					</div>
					<div>
						<Label>Action</Label>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start"
								>
									{getActionDisplayText()}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("action", "")
									}
								>
									Toutes les actions
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("action", "login")
									}
								>
									Connexion
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("action", "logout")
									}
								>
									Déconnexion
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange(
											"action",
											"failed_login"
										)
									}
								>
									Échec de connexion
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange(
											"action",
											"password_reset"
										)
									}
								>
									Réinitialisation mot de passe
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange(
											"action",
											"account_locked"
										)
									}
								>
									Compte verrouillé
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div>
						<Label>Statut</Label>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start"
								>
									{getSuccessDisplayText()}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("success", "")
									}
								>
									Tous les statuts
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("success", "true")
									}
								>
									Réussi
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("success", "false")
									}
								>
									Échoué
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div>
						<Label>Limite</Label>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start"
								>
									{getLimitDisplayText()}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("limit", "10")
									}
								>
									10
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("limit", "25")
									}
								>
									25
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("limit", "50")
									}
								>
									50
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										handleFilterChange("limit", "100")
									}
								>
									100
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* Tableau */}
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Utilisateur</TableHead>
								<TableHead>Action</TableHead>
								<TableHead>IP</TableHead>
								<TableHead>Localisation</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead>Date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-8"
									>
										Chargement...
									</TableCell>
								</TableRow>
							) : logs.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center py-8"
									>
										Aucun log trouvé
									</TableCell>
								</TableRow>
							) : (
								logs.map((log) => (
									<TableRow key={log.id}>
										<TableCell>
											<div>
												<div className="font-medium">
													{log.userId}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={getActionBadgeVariant(
													log.action
												)}
											>
												{getActionLabel(log.action)}
											</Badge>
										</TableCell>
										<TableCell className="font-mono text-sm">
											{log.ipAddress || "N/A"}
										</TableCell>
										<TableCell>
											{log.location || "N/A"}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													log.success
														? "default"
														: "destructive"
												}
											>
												{log.success
													? "Réussi"
													: "Échoué"}
											</Badge>
										</TableCell>
										<TableCell>
											{formatDate(log.createdAt)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				<div className="flex items-center justify-between mt-4">
					<div className="text-sm text-muted-foreground">
						{logs.length} logs affichés
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								handlePageChange(
									Math.max(
										0,
										parseInt(filters.offset) -
											parseInt(filters.limit)
									)
								)
							}
							disabled={parseInt(filters.offset) === 0}
						>
							Précédent
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								handlePageChange(
									parseInt(filters.offset) +
										parseInt(filters.limit)
								)
							}
							disabled={logs.length < parseInt(filters.limit)}
						>
							Suivant
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
