"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface LoginStats {
	totalLogins: number;
	successfulLogins: number;
	failedLogins: number;
	uniqueIPs: number;
}

interface LoginStatsProps {
	initialStats?: LoginStats;
}

export function LoginStats({ initialStats }: LoginStatsProps) {
	const [stats, setStats] = useState<LoginStats | null>(initialStats || null);
	const [loading, setLoading] = useState(false);
	const [filters, setFilters] = useState({
		userId: "",
		days: "30",
	});

	useEffect(() => {
		const fetchStats = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				if (filters.userId) params.append("userId", filters.userId);
				if (filters.days) params.append("days", filters.days);

				const response = await fetch(
					`/api/admin/login-logs/stats?${params}`
				);
				if (response.ok) {
					const data = await response.json();
					setStats(data.stats);
				}
			} catch (error) {
				console.error(
					"Erreur lors du chargement des statistiques:",
					error
				);
			} finally {
				setLoading(false);
			}
		};
		fetchStats();
	}, [filters]);

	const handleFilterChange = (key: string, value: string) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const getSuccessRate = () => {
		if (!stats || stats.totalLogins === 0) return 0;
		return Math.round((stats.successfulLogins / stats.totalLogins) * 100);
	};

	const getFailureRate = () => {
		if (!stats || stats.totalLogins === 0) return 0;
		return Math.round((stats.failedLogins / stats.totalLogins) * 100);
	};

	if (loading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Chargement...
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-8 bg-muted animate-pulse rounded" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!stats) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center h-32">
					<p className="text-muted-foreground">
						Aucune donnée disponible
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Filtres */}
			<Card>
				<CardHeader>
					<CardTitle>Filtres</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="userId">
								ID Utilisateur (optionnel)
							</Label>
							<Input
								id="userId"
								value={filters.userId}
								onChange={(e) =>
									handleFilterChange("userId", e.target.value)
								}
								placeholder="Filtrer par utilisateur spécifique"
							/>
						</div>
						<div>
							<Label htmlFor="days">Période (jours)</Label>
							<Input
								id="days"
								type="number"
								min="1"
								max="365"
								value={filters.days}
								onChange={(e) =>
									handleFilterChange("days", e.target.value)
								}
								placeholder="30"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Statistiques */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total des connexions
						</CardTitle>
						<Badge variant="outline">{filters.days}j</Badge>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.totalLogins}
						</div>
						<p className="text-xs text-muted-foreground">
							Tentatives de connexion
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Connexions réussies
						</CardTitle>
						<Badge variant="default">{getSuccessRate()}%</Badge>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{stats.successfulLogins}
						</div>
						<p className="text-xs text-muted-foreground">
							Connexions validées
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Échecs de connexion
						</CardTitle>
						<Badge variant="destructive">{getFailureRate()}%</Badge>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{stats.failedLogins}
						</div>
						<p className="text-xs text-muted-foreground">
							Tentatives échouées
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Adresses IP uniques
						</CardTitle>
						<Badge variant="secondary">IPs</Badge>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{stats.uniqueIPs}
						</div>
						<p className="text-xs text-muted-foreground">
							Appareils différents
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Graphique de répartition */}
			<Card>
				<CardHeader>
					<CardTitle>Répartition des connexions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">
								Connexions réussies
							</span>
							<span className="text-sm text-muted-foreground">
								{stats.successfulLogins} / {stats.totalLogins}
							</span>
						</div>
						<div className="w-full bg-muted rounded-full h-2">
							<div
								className="bg-green-600 h-2 rounded-full transition-all duration-300"
								style={{ width: `${getSuccessRate()}%` }}
							/>
						</div>

						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">
								Échecs de connexion
							</span>
							<span className="text-sm text-muted-foreground">
								{stats.failedLogins} / {stats.totalLogins}
							</span>
						</div>
						<div className="w-full bg-muted rounded-full h-2">
							<div
								className="bg-red-600 h-2 rounded-full transition-all duration-300"
								style={{ width: `${getFailureRate()}%` }}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
