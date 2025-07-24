"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Category } from "@prisma/client";
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

interface Product {
	id: string;
	title: string;
	description: string | null;
	price: number;
	condition: string;
	imagesUrl: string[];
	categoryId: string;
	createdAt: string;
	updatedAt: string;
	status: string;
	category: Category;
}

export default function AdminProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [productToDelete, setProductToDelete] = useState<Product | null>(
		null
	);

	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		try {
			const response = await fetch("/api/admin/products");
			if (response.ok) {
				const data = await response.json();
				setProducts(data);
			} else {
				toast.error("Erreur lors du chargement des produits");
			}
		} catch {
			toast.error("Erreur lors du chargement des produits");
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteProduct = async (product: Product) => {
		try {
			const response = await fetch(`/api/admin/products/${product.id}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Produit supprimé avec succès");
				fetchProducts();
			} else {
				toast.error("Erreur lors de la suppression du produit");
			}
		} catch {
			toast.error("Erreur lors de la suppression du produit");
		} finally {
			setProductToDelete(null);
		}
	};

	const openDeleteDialog = (product: Product) => {
		setProductToDelete(product);
	};

	const closeDeleteDialog = () => {
		setProductToDelete(null);
	};

	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.description
				?.toLowerCase()
				.includes(searchTerm.toLowerCase());

		const matchesStatus =
			statusFilter === "all" || product.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "active":
				return (
					<span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
						Actif
					</span>
				);
			case "pending":
				return (
					<span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
						En attente
					</span>
				);
			case "sold":
				return (
					<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
						Vendu
					</span>
				);
			default:
				return (
					<span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
						{status}
					</span>
				);
		}
	};

	if (loading) {
		return <div>Chargement...</div>;
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
								Gestion des produits
							</h1>
						</div>
						<Button className="flex items-center space-x-2">
							<Plus size={16} />
							<span>Ajouter un produit</span>
						</Button>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Card>
					<CardHeader>
						<CardTitle>Produits</CardTitle>
						<CardDescription>
							Gérez les produits de votre plateforme
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
									placeholder="Rechercher un produit..."
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className="pl-10"
								/>
							</div>
							<select
								value={statusFilter}
								onChange={(e) =>
									setStatusFilter(e.target.value)
								}
								className="px-3 py-2 border border-gray-300 rounded-md"
							>
								<option value="all">Tous les statuts</option>
								<option value="active">Actifs</option>
								<option value="pending">En attente</option>
								<option value="sold">Vendus</option>
							</select>
							<Button
								variant="outline"
								className="flex items-center space-x-2"
							>
								<Filter size={16} />
								<span>Filtrer</span>
							</Button>
						</div>

						{/* Products Table */}
						{loading ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
								<p className="mt-2 text-gray-600">
									Chargement...
								</p>
							</div>
						) : filteredProducts.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								{searchTerm || statusFilter !== "all"
									? "Aucun produit trouvé"
									: "Aucun produit disponible"}
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full border-collapse border border-gray-200">
									<thead>
										<tr className="bg-gray-50">
											<th className="border border-gray-200 px-4 py-2 text-left">
												Image
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Titre
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Description
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Prix
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Catégorie
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Statut
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
										{filteredProducts.map((product) => (
											<tr
												key={product.id}
												className="hover:bg-gray-50"
											>
												<td className="border border-gray-200 px-4 py-2">
													<div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
														{product.imagesUrl &&
														product.imagesUrl
															.length > 0 ? (
															// eslint-disable-next-line @next/next/no-img-element
															<img
																src={
																	product
																		.imagesUrl[0]
																}
																alt={
																	product.title
																}
																className="w-16 h-16 object-cover"
															/>
														) : (
															<div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
																<span className="text-gray-500 text-xs">
																	Aucune image
																</span>
															</div>
														)}
													</div>
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<div className="font-medium">
														{product.title}
													</div>
													<div className="text-sm text-gray-500">
														{product.condition}
													</div>
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<div className="max-w-xs truncate">
														{product.description ||
															"Aucune description"}
													</div>
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<span className="font-semibold">
														{product.price}€
													</span>
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<span className="text-sm text-gray-600">
														{
															product.category
																.displayName
														}
													</span>
												</td>
												<td className="border border-gray-200 px-4 py-2">
													{getStatusBadge(
														product.status
													)}
												</td>
												<td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
													{new Date(
														product.createdAt
													).toLocaleDateString()}
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<div className="flex space-x-2">
														<Link
															href={`/products/${product.categoryId}/${product.id}`}
														>
															<Button
																variant="outline"
																size="sm"
																className="flex items-center space-x-1"
															>
																<Eye
																	size={14}
																/>
																<span>
																	Voir
																</span>
															</Button>
														</Link>
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
														<AlertDialog
															open={
																productToDelete?.id ===
																product.id
															}
															onOpenChange={(
																open
															) => {
																if (!open) {
																	closeDeleteDialog();
																}
															}}
														>
															<AlertDialogTrigger
																asChild
															>
																<Button
																	variant="outline"
																	size="sm"
																	onClick={() =>
																		openDeleteDialog(
																			product
																		)
																	}
																	className="flex items-center space-x-1 text-red-600 hover:text-red-700"
																>
																	<Trash2
																		size={
																			14
																		}
																	/>
																	<span>
																		Supprimer
																	</span>
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		Êtes-vous
																		sûr de
																		vouloir
																		supprimer
																		ce
																		produit
																		?
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Cette
																		action
																		ne
																		pouvra
																		plus
																		être
																		annulée.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>
																		Annuler
																	</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			productToDelete &&
																			handleDeleteProduct(
																				productToDelete
																			)
																		}
																	>
																		Supprimer
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
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
