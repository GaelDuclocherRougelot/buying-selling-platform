"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
	ArrowLeft,
	Edit,
	Eye,
	Filter,
	Plus,
	Search,
	Trash2,
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

export default function AdminCategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		fetchCategories();
	}, []);

	const fetchCategories = async () => {
		try {
			const response = await apiFetch("/api/category");
			if (response.ok) {
				const data = await response.json();
				setCategories(data);
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
				fetchCategories();
			} else {
				toast.error("Erreur lors de la suppression de la catégorie");
			}
		} catch {
			toast.error("Erreur lors de la suppression de la catégorie");
		}
	};

	const filteredCategories = categories.filter(
		(category) =>
			category.displayName
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			category.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

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
										{filteredCategories.map((category) => (
											<tr
												key={category.id}
												className="hover:bg-gray-50"
											>
												<td className="border border-gray-200 px-4 py-2">
													<div className="font-medium">
														{category.displayName}
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
													<div className="flex space-x-2">
														<Button
															variant="outline"
															size="sm"
															className="flex items-center space-x-1"
														>
															<Eye size={14} />
															<span>Voir</span>
														</Button>
														<Button
															variant="outline"
															size="sm"
															className="flex items-center space-x-1"
														>
															<Edit size={14} />
															<span>
																Modifier
															</span>
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																handleDeleteCategory(
																	category.id
																)
															}
															className="flex items-center space-x-1 text-red-600 hover:text-red-700"
														>
															<Trash2 size={14} />
															<span>
																Supprimer
															</span>
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
