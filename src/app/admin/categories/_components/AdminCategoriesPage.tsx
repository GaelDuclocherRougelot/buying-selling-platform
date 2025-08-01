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
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Edit,
	Eye,
	Filter,
	MoreHorizontal,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Category {
	id: string;
	displayName: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalCategories: number;
	categoriesPerPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

interface EditCategoryForm {
	displayName: string;
	name: string;
}

export default function AdminCategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [editingCategory, setEditingCategory] = useState<Category | null>(
		null
	);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editForm, setEditForm] = useState<EditCategoryForm>({
		displayName: "",
		name: "",
	});

	useEffect(() => {
		fetchCategories(currentPage);
	}, [currentPage]);

	const fetchCategories = async (page: number = 1) => {
		try {
			const response = await apiFetch(
				`/api/admin/categories?page=${page}&limit=8`
			);
			if (response.ok) {
				const data = await response.json();

				// Gérer le cas où l'API ne retourne pas encore la structure avec pagination
				if (data.categories && data.pagination) {
					// Nouvelle structure avec pagination
					setCategories(data.categories);
					setPagination(data.pagination);
				} else {
					// Ancienne structure (tableau simple)
					setCategories(data);
					setPagination(null);
				}
			} else {
				toast.error("Erreur lors du chargement des catégories");
			}
		} catch {
			toast.error("Erreur lors du chargement des catégories");
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteCategory = async (categoryId: string) => {
		if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
			return;
		}

		try {
			const response = await apiFetch(
				`/api/admin/categories/${categoryId}`,
				{
					method: "DELETE",
				}
			);

			if (response.ok) {
				toast.success("Catégorie supprimée avec succès");
				fetchCategories(currentPage);
			} else {
				toast.error("Erreur lors de la suppression de la catégorie");
			}
		} catch {
			toast.error("Erreur lors de la suppression de la catégorie");
		}
	};

	const handlePageChange = (newPage: number) => {
		setCurrentPage(newPage);
	};

	const openEditModal = (category: Category) => {
		setEditingCategory(category);
		setEditForm({
			displayName: category.displayName,
			name: category.name,
		});
		setIsEditModalOpen(true);
	};

	const closeEditModal = () => {
		setEditingCategory(null);
		setIsEditModalOpen(false);
		setEditForm({
			displayName: "",
			name: "",
		});
	};

	const handleEditFormChange = (
		field: keyof EditCategoryForm,
		value: string
	) => {
		setEditForm((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleUpdateCategory = async () => {
		if (!editingCategory) return;

		try {
			const response = await apiFetch(
				`/api/admin/categories/${editingCategory.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(editForm),
				}
			);

			if (response.ok) {
				toast.success("Catégorie modifiée avec succès");
				fetchCategories(currentPage);
				closeEditModal();
			} else {
				const errorData = await response.json();
				toast.error(
					errorData.error ||
						"Erreur lors de la modification de la catégorie"
				);
			}
		} catch {
			toast.error("Erreur lors de la modification de la catégorie");
		}
	};

	const filteredCategories =
		categories?.filter(
			(category) =>
				category.displayName
					.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				category.name.toLowerCase().includes(searchTerm.toLowerCase())
		) || [];

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
									className="flex items-center space-x-2"
								>
									<ArrowLeft size={16} />
									<span>Retour</span>
								</Button>
							</Link>
							<h1 className="text-xl font-semibold text-gray-900">
								Gestion des catégories
							</h1>
						</div>
						<Button className="flex items-center space-x-2">
							<Plus size={16} />
							<span>Ajouter une catégorie</span>
						</Button>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Card>
					<CardHeader>
						<CardTitle>Catégories</CardTitle>
						<CardDescription>
							Gérez les catégories de produits de votre plateforme
							{pagination && (
								<span className="text-sm text-gray-500 ml-2">
									({pagination.totalCategories} catégories au
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
									placeholder="Rechercher une catégorie..."
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className="pl-10"
								/>
							</div>
							<Button
								variant="outline"
								className="flex items-center space-x-2"
							>
								<Filter size={16} />
								<span>Filtrer</span>
							</Button>
						</div>

						{/* Categories Table */}
						{loading ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
								<p className="mt-2 text-gray-600">
									Chargement...
								</p>
							</div>
						) : filteredCategories.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								{searchTerm
									? "Aucune catégorie trouvée"
									: "Aucune catégorie disponible"}
							</div>
						) : (
							<>
								<div className="overflow-x-auto">
									<table className="w-full border-collapse border border-gray-200">
										<thead>
											<tr className="bg-gray-50">
												<th className="border border-gray-200 px-4 py-2 text-left">
													Nom d&apos;affichage
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Nom technique
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Date de création
												</th>
												<th className="border border-gray-200 px-4 py-2 text-left">
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{filteredCategories.map(
												(category) => (
													<tr
														key={category.id}
														className="hover:bg-gray-50"
													>
														<td className="border border-gray-200 px-4 py-2">
															<div className="font-medium">
																{
																	category.displayName
																}
															</div>
														</td>
														<td className="border border-gray-200 px-4 py-2">
															<span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
																{category.name}
															</span>
														</td>
														<td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
															{new Date(
																category.createdAt
															).toLocaleDateString()}
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
																			le
																			menu
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
																		Voir la
																		catégorie
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={() =>
																			openEditModal(
																				category
																			)
																		}
																		className="cursor-pointer"
																	>
																		<Edit
																			size={
																				14
																			}
																			className="mr-2"
																		/>
																		Modifier
																		la
																		catégorie
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={() =>
																			handleDeleteCategory(
																				category.id
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
																		la
																		catégorie
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														</td>
													</tr>
												)
											)}
										</tbody>
									</table>
								</div>

								{/* Pagination Controls */}
								{pagination && (
									<div className="flex items-center justify-between mt-6">
										<div className="text-sm text-gray-700">
											Affichage de{" "}
											{(pagination.currentPage - 1) *
												pagination.categoriesPerPage +
												1}{" "}
											à{" "}
											{Math.min(
												pagination.currentPage *
													pagination.categoriesPerPage,
												pagination.totalCategories
											)}{" "}
											sur {pagination.totalCategories}{" "}
											catégories
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

			{/* Edit Category Modal */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Modifier la catégorie</DialogTitle>
						<DialogDescription>
							Modifiez les informations de la catégorie
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="displayName">
								Nom d&apos;affichage
							</Label>
							<Input
								id="displayName"
								value={editForm.displayName}
								onChange={(e) =>
									handleEditFormChange(
										"displayName",
										e.target.value
									)
								}
								placeholder="Nom d'affichage de la catégorie"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Nom technique</Label>
							<Input
								id="name"
								value={editForm.name}
								onChange={(e) =>
									handleEditFormChange("name", e.target.value)
								}
								placeholder="nom-technique-de-la-categorie"
							/>
							<p className="text-sm text-gray-500">
								Le nom technique doit être unique et ne contenir
								que des lettres minuscules, des chiffres et des
								tirets.
							</p>
						</div>
					</div>
					<div className="flex justify-between">
						<Button variant="outline" onClick={closeEditModal}>
							<X size={16} className="mr-2" />
							Annuler
						</Button>
						<Button onClick={handleUpdateCategory}>
							Enregistrer les modifications
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
