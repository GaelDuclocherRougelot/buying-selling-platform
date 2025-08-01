"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { User } from "@prisma/client";
import {
	AlertTriangle,
	ArrowLeft,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Edit,
	Eye,
	EyeOff,
	Filter,
	Lock,
	Mail,
	MoreHorizontal,
	Search,
	Shield,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalUsers: number;
	usersPerPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

interface UsersResponse {
	users: User[];
	pagination: PaginationInfo;
}

interface Filters {
	role: string;
	emailVerified: string;
	deletedAt: string;
	dateFrom: string;
	dateTo: string;
}

// Fonction utilitaire pour masquer les données sensibles
const maskEmail = (email: string): string => {
	const [localPart, domain] = email.split("@");
	if (localPart.length <= 2) return email;
	return `${localPart.substring(0, 2)}***@${domain}`;
};

const maskName = (name: string): string => {
	if (name.length <= 2) return name;
	return `${name.substring(0, 1)}***`;
};

const maskUsername = (username: string | null): string => {
	if (!username || username.length <= 2) return username || "sans-pseudo";
	return `${username.substring(0, 2)}***`;
};

export default function AdminUsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
	const [showSensitiveData, setShowSensitiveData] = useState(false);
	const [gdprConsent, setGdprConsent] = useState(false);
	const [filters, setFilters] = useState<Filters>({
		role: "",
		emailVerified: "",
		deletedAt: "",
		dateFrom: "",
		dateTo: "",
	});

	useEffect(() => {
		fetchUsers(currentPage);
	}, [currentPage]);

	const fetchUsers = async (page: number = 1) => {
		try {
			const response = await apiFetch(
				`/api/admin/users?page=${page}&limit=8`
			);
			if (response.ok) {
				const data: UsersResponse = await response.json();
				setUsers(data.users);
				setPagination(data.pagination);
			} else {
				toast.error("Erreur lors du chargement des utilisateurs");
			}
			setLoading(false);
		} catch {
			toast.error("Erreur lors du chargement des utilisateurs");
			setLoading(false);
		}
	};

	const handleDeleteUser = async (userId: string) => {
		if (
			!confirm(
				"Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et doit respecter le droit à l'effacement du RGPD."
			)
		) {
			return;
		}

		try {
			const response = await apiFetch(`/api/admin/users/${userId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success(
					"Utilisateur supprimé avec succès (conformément au RGPD)"
				);
				fetchUsers(currentPage);
			} else {
				toast.error("Erreur lors de la suppression de l'utilisateur");
			}
		} catch {
			toast.error("Erreur lors de la suppression de l'utilisateur");
		}
	};

	const handlePageChange = (newPage: number) => {
		setCurrentPage(newPage);
	};

	const handleFilterChange = (key: keyof Filters, value: string) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const applyFilters = () => {
		setCurrentPage(1);
		setIsFilterModalOpen(false);
		toast.success("Filtres appliqués");
	};

	const clearFilters = () => {
		setFilters({
			role: "",
			emailVerified: "",
			deletedAt: "",
			dateFrom: "",
			dateTo: "",
		});
		setCurrentPage(1);
		setIsFilterModalOpen(false);
		toast.success("Filtres supprimés");
	};

	const hasActiveFilters = Object.values(filters).some(
		(value) => value !== ""
	);

	const getFilterDisplayValue = (key: keyof Filters): string => {
		const value = filters[key];
		switch (key) {
			case "role":
				if (value === "user") return "Utilisateur";
				if (value === "moderator") return "Modérateur";
				if (value === "admin") return "Administrateur";
				return "Tous les rôles";
			case "emailVerified":
				if (value === "true") return "Vérifiés";
				if (value === "false") return "Non vérifiés";
				return "Tous";
			case "deletedAt":
				if (value === "true") return "Supprimés";
				if (value === "false") return "Actifs";
				return "Tous";
			default:
				return value || "";
		}
	};

	const filteredUsers = users.filter((user) => {
		// Filtre de recherche textuelle
		const matchesSearch =
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.username?.toLowerCase().includes(searchTerm.toLowerCase());

		if (!matchesSearch) return false;

		// Filtre par rôle
		if (filters.role && user.role !== filters.role) return false;

		// Filtre par vérification email
		if (filters.emailVerified !== "") {
			const isVerified = filters.emailVerified === "true";
			if (user.emailVerified !== isVerified) return false;
		}

		// Filtre par statut de suppression
		if (filters.deletedAt !== "") {
			const isDeleted = filters.deletedAt === "true";
			const userIsDeleted = !!user.deletedAt;
			if (userIsDeleted !== isDeleted) return false;
		}

		// Filtre par date d'inscription
		if (filters.dateFrom || filters.dateTo) {
			const userDate = new Date(user.createdAt);
			const fromDate = filters.dateFrom
				? new Date(filters.dateFrom)
				: null;
			const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

			if (fromDate && userDate < fromDate) return false;
			if (toDate && userDate > toDate) return false;
		}

		return true;
	});

	// Avertissement RGPD
	if (!gdprConsent) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="max-w-md w-full mx-4">
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Lock className="h-5 w-5 text-orange-500" />
							<span>Protection des données</span>
						</CardTitle>
						<CardDescription>
							Cette page contient des données personnelles
							sensibles. En accédant à ces informations, vous vous
							engagez à respecter le RGPD.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
							<div className="flex items-start space-x-2">
								<AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
								<div className="text-sm text-orange-800">
									<p className="font-medium mb-2">
										Avertissement RGPD :
									</p>
									<ul className="list-disc list-inside space-y-1">
										<li>
											Les données affichées sont à usage
											administratif uniquement
										</li>
										<li>
											Ne partagez pas ces informations
											avec des tiers
										</li>
										<li>
											Respectez le droit à
											l&apos;effacement des utilisateurs
										</li>
										<li>
											Les données sensibles sont masquées
											par défaut
										</li>
									</ul>
								</div>
							</div>
						</div>
						<Button
							onClick={() => setGdprConsent(true)}
							className="w-full"
						>
							Je comprends et j'accepte
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-4">
							<Link href="/admin">
								<Button
									variant="outline"
									size="sm"
									className="flex items-center space-x-2 cursor-pointer"
								>
									<ArrowLeft size={16} />
									<span>Retour</span>
								</Button>
							</Link>
							<h1 className="text-xl font-semibold text-gray-900">
								Gestion des utilisateurs
							</h1>
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setShowSensitiveData(!showSensitiveData)
								}
								className="flex items-center space-x-2"
							>
								{showSensitiveData ? (
									<EyeOff size={16} />
								) : (
									<Eye size={16} />
								)}
								<span>
									{showSensitiveData ? "Masquer" : "Afficher"}{" "}
									les données sensibles
								</span>
							</Button>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Avertissement RGPD */}
				<div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div className="flex items-start space-x-2">
						<Shield className="h-5 w-5 text-blue-500 mt-0.5" />
						<div className="text-sm text-blue-800">
							<p className="font-medium mb-1">
								Protection RGPD active :
							</p>
							<p>
								Les données personnelles sont protégées.
								Utilisez le bouton &quot;Afficher les données
								sensibles&quot; pour accéder aux informations
								complètes si nécessaire.
							</p>
						</div>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Utilisateurs</CardTitle>
						<CardDescription>
							Gérez les comptes utilisateurs de votre plateforme
							{pagination && (
								<span className="text-sm text-gray-500 ml-2">
									({pagination.totalUsers} utilisateurs au
									total)
								</span>
							)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Search and Filter */}
						<div className="flex space-x-4 mb-6">
							<div className="relative flex-1">
								<Search
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
									size={16}
								/>
								<Input
									type="text"
									placeholder="Rechercher un utilisateur..."
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className="pl-10"
								/>
							</div>
							<Dialog
								open={isFilterModalOpen}
								onOpenChange={setIsFilterModalOpen}
							>
								<DialogTrigger asChild>
									<Button
										variant={
											hasActiveFilters
												? "default"
												: "outline"
										}
										className="flex items-center space-x-2"
									>
										<Filter size={16} />
										<span>Filtrer</span>
										{hasActiveFilters && (
											<div className="w-2 h-2 bg-white rounded-full"></div>
										)}
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[500px]">
									<DialogHeader>
										<DialogTitle>
											Filtrer les utilisateurs
										</DialogTitle>
										<DialogDescription>
											Appliquez des filtres pour affiner
											votre recherche
										</DialogDescription>
									</DialogHeader>
									<div className="grid gap-4 py-4">
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="role">
													Rôle
												</Label>
												<DropdownMenu>
													<DropdownMenuTrigger
														asChild
													>
														<Button
															variant="outline"
															className="w-full justify-between"
														>
															{getFilterDisplayValue(
																"role"
															)}
															<ChevronDown
																size={16}
															/>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent className="w-full">
														<DropdownMenuItem
															onClick={() =>
																handleFilterChange(
																	"role",
																	""
																)
															}
														>
															Tous les rôles
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																handleFilterChange(
																	"role",
																	"user"
																)
															}
														>
															Utilisateur
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																handleFilterChange(
																	"role",
																	"moderator"
																)
															}
														>
															Modérateur
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																handleFilterChange(
																	"role",
																	"admin"
																)
															}
														>
															Administrateur
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
											<div className="space-y-2">
												<Label htmlFor="emailVerified">
													Email vérifié
												</Label>
												<DropdownMenu>
													<DropdownMenuTrigger
														asChild
													>
														<Button
															variant="outline"
															className="w-full justify-between"
														>
															{getFilterDisplayValue(
																"emailVerified"
															)}
															<ChevronDown
																size={16}
															/>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent className="w-full">
														<DropdownMenuItem
															onClick={() =>
																handleFilterChange(
																	"emailVerified",
																	""
																)
															}
														>
															Tous
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																handleFilterChange(
																	"emailVerified",
																	"true"
																)
															}
														>
															Vérifiés
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																handleFilterChange(
																	"emailVerified",
																	"false"
																)
															}
														>
															Non vérifiés
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="deletedAt">
												Statut de suppression
											</Label>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="outline"
														className="w-full justify-between"
													>
														{getFilterDisplayValue(
															"deletedAt"
														)}
														<ChevronDown
															size={16}
														/>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent className="w-full">
													<DropdownMenuItem
														onClick={() =>
															handleFilterChange(
																"deletedAt",
																""
															)
														}
													>
														Tous
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															handleFilterChange(
																"deletedAt",
																"false"
															)
														}
													>
														Actifs
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															handleFilterChange(
																"deletedAt",
																"true"
															)
														}
													>
														Supprimés
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="dateFrom">
													Date d&apos;inscription
													depuis
												</Label>
												<Input
													type="date"
													value={filters.dateFrom}
													onChange={(e) =>
														handleFilterChange(
															"dateFrom",
															e.target.value
														)
													}
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="dateTo">
													Date d&apos;inscription
													jusqu&apos;au
												</Label>
												<Input
													type="date"
													value={filters.dateTo}
													onChange={(e) =>
														handleFilterChange(
															"dateTo",
															e.target.value
														)
													}
												/>
											</div>
										</div>
									</div>
									<div className="flex justify-between">
										<Button
											variant="outline"
											onClick={clearFilters}
										>
											<X size={16} className="mr-2" />
											Effacer les filtres
										</Button>
										<Button onClick={applyFilters}>
											Appliquer les filtres
										</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>

						{/* Users Table */}
						{loading ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
								<p className="mt-2 text-gray-600">
									Chargement...
								</p>
							</div>
						) : filteredUsers.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								{searchTerm || hasActiveFilters
									? "Aucun utilisateur trouvé avec ces critères"
									: "Aucun utilisateur disponible"}
							</div>
						) : (
							<>
								<div className="overflow-x-auto">
									<table className="w-full border-collapse border border-gray-200">
										<thead>
											<tr className="bg-gray-50">
												<th className="border border-gray-200 px-4 py-2 text-left">
													Photo
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Nom
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Email
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Rôle
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Vérifié
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Supprimé?
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Date d&apos;inscription
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{filteredUsers.map((user) => (
												<tr
													key={user.id}
													className="hover:bg-gray-50"
												>
													<td className="border border-gray-200 px-4 py-2">
														<div className="flex items-center space-x-3">
															<div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
																{/* eslint-disable-next-line @next/next/no-img-element */}
																<img
																	src={
																		user.image ||
																		"/images/profile_default.webp"
																	}
																	alt={
																		showSensitiveData
																			? user.name
																			: "Utilisateur"
																	}
																	className="w-10 h-10 rounded-full object-cover"
																/>
															</div>
														</div>
													</td>
													<td className="border border-gray-200 px-4 py-2 whitespace-nowrap">
														<div className="font-medium">
															{showSensitiveData
																? user.name
																: maskName(
																		user.name
																	)}
														</div>
														<div className="text-sm text-gray-500">
															@
															{showSensitiveData
																? user.username ||
																	"sans-pseudo"
																: maskUsername(
																		user.username
																	)}
														</div>
													</td>
													<td className="border border-gray-200 px-4 py-2">
														<div className="flex items-center space-x-2">
															<Mail
																size={14}
																className="text-gray-400"
															/>
															<span>
																{showSensitiveData
																	? user.email
																	: maskEmail(
																			user.email
																		)}
															</span>
														</div>
													</td>
													<td className="border border-gray-200 px-4 py-2">
														<div className="flex items-center space-x-2">
															<Shield
																size={14}
																className="text-gray-400"
															/>
															<span
																className={`px-2 py-1 text-xs rounded-full ${
																	user.role ===
																	"admin"
																		? "bg-red-100 text-red-800"
																		: user.role ===
																			  "moderator"
																			? "bg-yellow-100 text-yellow-800"
																			: "bg-blue-100 text-blue-800"
																}`}
															>
																{user.role}
															</span>
														</div>
													</td>
													<td className="border border-gray-200 px-4 py-2 w-full">
														<span
															className={`px-2 py-1 text-xs rounded-full ${
																user.emailVerified
																	? "bg-green-100 text-green-800"
																	: "bg-orange-100 text-orange-800"
															}`}
														>
															{user.emailVerified
																? "Vérifié"
																: "Non vérifié"}
														</span>
													</td>
													<td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
														{user.deletedAt
															? new Date(
																	user.deletedAt
																).toLocaleString()
															: "Non supprimé"}
													</td>
													<td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
														{new Date(
															user.createdAt
														).toLocaleString()}
													</td>
													<td className="border border-gray-200 px-4 py-2">
														<DropdownMenu>
															<DropdownMenuTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	className="h-8 w-8 p-0"
																>
																	<span className="sr-only">
																		Ouvrir
																		le menu
																	</span>
																	<MoreHorizontal className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuLabel>
																	Actions
																</DropdownMenuLabel>
																<DropdownMenuSeparator />
																<DropdownMenuItem className="cursor-pointer">
																	<Eye
																		size={
																			14
																		}
																		className="mr-2"
																	/>
																	Voir
																	l&apos;utilisateur
																</DropdownMenuItem>
																<DropdownMenuItem className="cursor-pointer">
																	<Edit
																		size={
																			14
																		}
																		className="mr-2"
																	/>
																	Modifier
																	l&apos;utilisateur
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		handleDeleteUser(
																			user.id
																		)
																	}
																	className="cursor-pointer text-red-600 hover:text-red-700"
																>
																	<Trash2
																		size={
																			14
																		}
																		className="mr-2"
																	/>
																	Supprimer
																	l&apos;utilisateur
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								{/* Pagination Controls */}
								{pagination && (
									<div className="flex items-center justify-between mt-6">
										<div className="text-sm text-gray-700">
											Affichage de{" "}
											{(pagination.currentPage - 1) *
												pagination.usersPerPage +
												1}{" "}
											à{" "}
											{Math.min(
												pagination.currentPage *
													pagination.usersPerPage,
												pagination.totalUsers
											)}{" "}
											sur {pagination.totalUsers}{" "}
											utilisateurs
										</div>
										<div className="flex items-center space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handlePageChange(
														pagination.currentPage -
															1
													)
												}
												disabled={
													!pagination.hasPreviousPage
												}
												className="flex items-center space-x-1"
											>
												<ChevronLeft size={16} />
												<span>Précédent</span>
											</Button>

											<div className="flex items-center space-x-1">
												{Array.from(
													{
														length: Math.min(
															5,
															pagination.totalPages
														),
													},
													(_, i) => {
														const pageNum = i + 1;
														return (
															<Button
																key={pageNum}
																variant={
																	pageNum ===
																	pagination.currentPage
																		? "default"
																		: "outline"
																}
																size="sm"
																onClick={() =>
																	handlePageChange(
																		pageNum
																	)
																}
																className="w-8 h-8 p-0"
															>
																{pageNum}
															</Button>
														);
													}
												)}
											</div>

											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													handlePageChange(
														pagination.currentPage +
															1
													)
												}
												disabled={
													!pagination.hasNextPage
												}
												className="flex items-center space-x-1"
											>
												<span>Suivant</span>
												<ChevronRight size={16} />
											</Button>
										</div>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
