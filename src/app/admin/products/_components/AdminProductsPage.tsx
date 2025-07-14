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
}

export default function AdminProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		fetchProducts();
	}, []);

	const fetchProducts = async () => {
		try {
			const response = await fetch("/api/products");
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

	const handleDeleteProduct = async (productId: string) => {
		if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/products/${productId}`, {
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
		}
	};

	const filteredProducts = products.filter(
		(product) =>
			product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.description
				?.toLowerCase()
				.includes(searchTerm.toLowerCase())
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
							Gérez les produits en vente sur votre plateforme
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
								{searchTerm
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
												Prix
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												État
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
													<div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
														{product.imagesUrl
															.length > 0 ? (
															<img
																src={
																	product
																		.imagesUrl[0]
																}
																alt={
																	product.title
																}
																className="w-12 h-12 object-cover rounded"
															/>
														) : (
															<span className="text-gray-400 text-xs">
																Aucune image
															</span>
														)}
													</div>
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<div>
														<div className="font-medium">
															{product.title}
														</div>
														<div className="text-sm text-gray-500 truncate max-w-xs">
															{
																product.description
															}
														</div>
													</div>
												</td>
												<td className="border border-gray-200 px-4 py-2 font-medium">
													{product.price}€
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
														{product.condition}
													</span>
												</td>
												<td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
													{new Date(
														product.createdAt
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
																handleDeleteProduct(
																	product.id
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
