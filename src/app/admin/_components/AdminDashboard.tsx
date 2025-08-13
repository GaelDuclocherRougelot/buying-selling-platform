"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { signOut } from "@/lib/auth-client";
import { User } from "better-auth";
import {
	AlertTriangle,
	ArrowLeft,
	Euro,
	Loader2Icon,
	LogIn,
	LogOut,
	Package,
	ShoppingCart,
	Tag,
	Truck,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AdminDashboardProps {
	user: User;
}

interface AdminStats {
	totalProducts: number;
	totalCategories: number;
	salesCount: number;
	totalRevenue: number;
	totalUsers: number;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
	const router = useRouter();
	const [stats, setStats] = useState<AdminStats>({
		totalProducts: 0,
		totalCategories: 0,
		salesCount: 0,
		totalRevenue: 0,
		totalUsers: 0,
	});
	const [loading, setLoading] = useState(true);
	const handleSignOut = async () => {
		await signOut();
		toast.success("Déconnexion réussie");
		router.push("/");
	};

	useEffect(() => {
		fetchStats();
	}, []);

	const fetchStats = async () => {
		try {
			const response = await apiFetch("/api/admin/dashboard");
			if (response.ok) {
				const data = await response.json();
				setStats(data);
			} else {
				toast.error("Erreur lors du chargement des stats");
			}
			setLoading(false);
		} catch {
			toast.error("Erreur lors du chargement des stats");
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-semibold text-gray-900">
								Tableau de bord Administrateur
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600">
								Connecté en tant que {user.name}
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => router.push("/")}
								className="flex items-center space-x-2 cursor-pointer"
							>
								<ArrowLeft size={16} />
								<span>Accéder au site</span>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleSignOut}
								className="flex items-center space-x-2 cursor-pointer"
							>
								<LogOut size={16} />
								<span>Déconnexion</span>
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Utilisateurs
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{loading ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									stats.totalUsers
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								Utilisateurs vérifiés
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Annonces
							</CardTitle>
							<Package className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{loading ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									stats.totalProducts
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								Annonces actives
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Catégories
							</CardTitle>
							<Tag className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{loading ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									stats.totalCategories
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								Catégories actives
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Ventes
							</CardTitle>
							<ShoppingCart className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{loading ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									stats.salesCount
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								Ventes réalisées entre les particuliers
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Chiffre d&apos;affaires
							</CardTitle>
							<Euro className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{loading ? (
									<Loader2Icon className="h-4 w-4 animate-spin" />
								) : (
									`${stats.totalRevenue.toFixed(2)}€`
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								Total des commissions
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Main Content */}
				<Card>
					<CardHeader>
						<CardTitle>
							Bienvenue dans votre tableau de bord
						</CardTitle>
						<CardDescription>
							Gérez vos utilisateurs, produits et catégories
							depuis cette interface.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Link href="/admin/users">
								<Card className="hover:shadow-md transition-shadow cursor-pointer">
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<Users size={20} />
											<span>Gérer les utilisateurs</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											Consultez et gérez les comptes
											utilisateurs
										</p>
									</CardContent>
								</Card>
							</Link>

							<Link href="/admin/products">
								<Card className="hover:shadow-md transition-shadow cursor-pointer">
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<Package size={20} />
											<span>Gérer les annonces</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											Consultez et gérez les annonces en
											vente
										</p>
									</CardContent>
								</Card>
							</Link>

							<Link href="/admin/categories">
								<Card className="hover:shadow-md transition-shadow cursor-pointer">
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<Tag size={20} />
											<span>Gérer les catégories</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											Consultez et gérez les catégories
											d&apos;annonces
										</p>
									</CardContent>
								</Card>
							</Link>
							<Link href="/admin/login-logs">
								<Card className="hover:shadow-md transition-shadow cursor-pointer">
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<LogIn size={20} />
											<span>
												Historique des connexions
											</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											Consultez et gérez l&apos;historique
											des connexions utilisateurs
										</p>
									</CardContent>
								</Card>
							</Link>

							<Link href="/admin/shipping-proofs">
								<Card className="hover:shadow-md transition-shadow cursor-pointer">
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<Truck size={20} />
											<span>
												Preuves d&apos;expédition
											</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											Validez les preuves
											d&apos;expédition et débloquez les
											paiements
										</p>
									</CardContent>
								</Card>
							</Link>

							<Link href="/admin/error-logs">
								<Card className="hover:shadow-md transition-shadow cursor-pointer">
									<CardHeader>
										<CardTitle className="flex items-center space-x-2">
											<AlertTriangle size={20} />
											<span>Logs d&apos;erreur</span>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											Surveillez et gérez les erreurs de
											l&apos;application
										</p>
									</CardContent>
								</Card>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
