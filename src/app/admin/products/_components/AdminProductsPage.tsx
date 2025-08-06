"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { Category } from "@prisma/client";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Clock,
	Edit,
	Eye,
	Filter,
	MoreHorizontal,
	Package,
	Plus,
	Receipt,
	Search,
	Trash2,
	Truck,
	X,
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

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalProducts: number;
	productsPerPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

interface EditProductForm {
	title: string;
	description: string;
	price: number;
	condition: string;
	status: string;
	categoryId: string;
	imagesUrl: string[];
}

interface ShippingProof {
	id: string;
	paymentId: string;
	proofType: string;
	proofData: {
		trackingNumber: string;
		receiptImageUrl: string;
		packageImageUrl: string;
		description?: string;
		submittedAt: string;
	};
	status: string;
	submittedAt: string;
	verifiedAt?: string;
	verifiedBy?: string;
}

interface Payment {
	id: string;
	amount: number;
	status: string;
	productId: string;
	buyerId: string;
	sellerId: string;
	createdAt: string;
	product: Product;
	buyer: {
		id: string;
		username: string;
		email: string;
	};
	seller: {
		id: string;
		username: string;
		email: string;
	};
}

export default function AdminProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [productToDelete, setProductToDelete] = useState<Product | null>(
		null
	);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isShippingProofModalOpen, setIsShippingProofModalOpen] =
		useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(
		null
	);
	const [shippingProofs, setShippingProofs] = useState<ShippingProof[]>([]);

	const [payments, setPayments] = useState<Payment[]>([]);
	const [loadingProofs, setLoadingProofs] = useState(false);
	const [editForm, setEditForm] = useState<EditProductForm>({
		title: "",
		description: "",
		price: 0,
		condition: "",
		status: "",
		categoryId: "",
		imagesUrl: [],
	});

	useEffect(() => {
		fetchProducts(currentPage);
		fetchCategories();
	}, [currentPage]);

	const fetchProducts = async (page: number = 1) => {
		try {
			const response = await apiFetch(
				`/api/admin/products?page=${page}&limit=8`
			);
			if (response.ok) {
				const data = await response.json();

				// Gérer le cas où l'API ne retourne pas encore la structure avec pagination
				if (data.products && data.pagination) {
					// Nouvelle structure avec pagination
					setProducts(data.products);
					setPagination(data.pagination);
				} else {
					// Ancienne structure (tableau simple)
					setProducts(data);
					setPagination(null);
				}
			} else {
				toast.error("Erreur lors du chargement des produits");
			}
		} catch {
			toast.error("Erreur lors du chargement des produits");
		} finally {
			setLoading(false);
		}
	};

	const fetchCategories = async () => {
		try {
			const response = await apiFetch("/api/categories");
			if (response.ok) {
				const data = await response.json();
				setCategories(data);
			}
		} catch {
			console.error("Erreur lors du chargement des catégories");
		}
	};

	const fetchShippingProofs = async (productId: string) => {
		setLoadingProofs(true);
		try {
			// Récupérer les paiements pour ce produit
			const paymentsResponse = await apiFetch(
				`/api/admin/products/${productId}/payments`
			);
			if (paymentsResponse.ok) {
				const paymentsData = await paymentsResponse.json();
				setPayments(paymentsData);

				// Récupérer les preuves d'expédition pour chaque paiement
				const proofsPromises = paymentsData.map(
					async (payment: Payment) => {
						const proofResponse = await apiFetch(
							`/api/shipping/proof?paymentId=${payment.id}`
						);
						if (proofResponse.ok) {
							const proofData = await proofResponse.json();
							return proofData.proof
								? { ...proofData.proof, payment }
								: null;
						}
						return null;
					}
				);

				const proofs = await Promise.all(proofsPromises);
				setShippingProofs(proofs.filter((proof) => proof !== null));
			}
		} catch (error) {
			console.error("Erreur lors du chargement des preuves:", error);
			toast.error("Erreur lors du chargement des preuves d'expédition");
		} finally {
			setLoadingProofs(false);
		}
	};

	const openShippingProofModal = async (product: Product) => {
		setSelectedProduct(product);
		setIsShippingProofModalOpen(true);
		await fetchShippingProofs(product.id);
	};

	const closeShippingProofModal = () => {
		setSelectedProduct(null);
		setIsShippingProofModalOpen(false);
		setShippingProofs([]);
		setPayments([]);
	};

	const handleVerifyProof = async (
		proofId: string,
		status: "verified" | "rejected"
	) => {
		try {
			const response = await apiFetch(
				`/api/admin/shipping-proofs/${proofId}/verify`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status }),
				}
			);

			if (response.ok) {
				toast.success(
					`Preuve ${status === "verified" ? "validée" : "rejetée"} avec succès`
				);
				// Recharger les preuves
				if (selectedProduct) {
					await fetchShippingProofs(selectedProduct.id);
				}
			} else {
				toast.error("Erreur lors de la vérification de la preuve");
			}
		} catch {
			toast.error("Erreur lors de la vérification de la preuve");
		}
	};

	const handleDeleteProduct = async (product: Product) => {
		try {
			const response = await apiFetch(
				`/api/admin/products/${product.id}`,
				{
					method: "DELETE",
				}
			);

			if (response.ok) {
				toast.success("Produit supprimé avec succès");
				fetchProducts(currentPage);
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

	const openEditModal = (product: Product) => {
		setEditingProduct(product);
		setEditForm({
			title: product.title,
			description: product.description || "",
			price: product.price,
			condition: product.condition,
			status: product.status,
			categoryId: product.categoryId,
			imagesUrl: product.imagesUrl,
		});
		setIsEditModalOpen(true);
	};

	const closeEditModal = () => {
		setEditingProduct(null);
		setIsEditModalOpen(false);
		setEditForm({
			title: "",
			description: "",
			price: 0,
			condition: "",
			status: "",
			categoryId: "",
			imagesUrl: [],
		});
	};

	const handleEditFormChange = (
		field: keyof EditProductForm,
		value: string | number | string[]
	) => {
		setEditForm((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleUpdateProduct = async () => {
		if (!editingProduct) return;

		try {
			const response = await apiFetch(
				`/api/admin/products/${editingProduct.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(editForm),
				}
			);

			if (response.ok) {
				toast.success("Produit modifié avec succès");
				fetchProducts(currentPage);
				closeEditModal();
			} else {
				const errorData = await response.json();
				toast.error(
					errorData.error ||
						"Erreur lors de la modification du produit"
				);
			}
		} catch {
			toast.error("Erreur lors de la modification du produit");
		}
	};

	const handlePageChange = (newPage: number) => {
		setCurrentPage(newPage);
	};

	const getStatusDisplayValue = (status: string): string => {
		switch (status) {
			case "active":
				return "Actif";
			case "pending":
				return "En attente";
			case "sold":
				return "Vendu";
			default:
				return status;
		}
	};

	const getConditionDisplayValue = (condition: string): string => {
		switch (condition) {
			case "pristine":
				return "Neuf";
			case "good":
				return "Bon état";
			case "mid":
				return "État moyen";
			case "damaged":
				return "Mauvais état";
			default:
				return condition;
		}
	};

	const getProofStatusIcon = (status: string) => {
		switch (status) {
			case "verified":
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			case "rejected":
				return <AlertCircle className="h-5 w-5 text-red-500" />;
			default:
				return <Clock className="h-5 w-5 text-orange-500" />;
		}
	};

	const getProofStatusColor = (status: string) => {
		switch (status) {
			case "verified":
				return "bg-green-100 text-green-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-orange-100 text-orange-800";
		}
	};

	const getProofStatusLabel = (status: string) => {
		switch (status) {
			case "verified":
				return "Validée";
			case "rejected":
				return "Rejetée";
			default:
				return "En attente de vérification";
		}
	};

	const filteredProducts =
		products?.filter((product) => {
			const matchesSearch =
				product.title
					.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				product.description
					?.toLowerCase()
					.includes(searchTerm.toLowerCase());

			const matchesStatus =
				statusFilter === "all" || product.status === statusFilter;

			return matchesSearch && matchesStatus;
		}) || [];

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
							{pagination && (
								<span className="text-sm text-gray-500 ml-2">
									({pagination.totalProducts} produits au
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
							<>
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
																		Aucune
																		image
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
																	<Link
																		href={`/products/${product.categoryId}/${product.id}`}
																		className="flex items-center"
																	>
																		<Eye
																			size={
																				14
																			}
																			className="mr-2"
																		/>
																		Voir le
																		produit
																	</Link>
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		openShippingProofModal(
																			product
																		)
																	}
																	className="cursor-pointer"
																>
																	<Package
																		size={
																			14
																		}
																		className="mr-2"
																	/>
																	Vérifier les
																	expéditions
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		openEditModal(
																			product
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
																	Modifier le
																	produit
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		openDeleteDialog(
																			product
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
																	Supprimer le
																	produit
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
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
																		pourra
																		plus
																		être
																		annulée.
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>
																		Annuler
																	</AlertDialogCancel>
																	<Button
																		variant="destructive"
																		onClick={() =>
																			productToDelete &&
																			handleDeleteProduct(
																				productToDelete
																			)
																		}
																	>
																		Supprimer
																	</Button>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
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
												pagination.productsPerPage +
												1}{" "}
											à{" "}
											{Math.min(
												pagination.currentPage *
													pagination.productsPerPage,
												pagination.totalProducts
											)}{" "}
											sur {pagination.totalProducts}{" "}
											produits
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

			{/* Edit Product Modal */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Modifier le produit</DialogTitle>
						<DialogDescription>
							Modifiez les informations du produit
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="title">Titre</Label>
								<Input
									id="title"
									value={editForm.title}
									onChange={(e) =>
										handleEditFormChange(
											"title",
											e.target.value
										)
									}
									placeholder="Titre du produit"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="price">Prix (€)</Label>
								<Input
									id="price"
									type="number"
									value={editForm.price}
									onChange={(e) =>
										handleEditFormChange(
											"price",
											parseFloat(e.target.value) || 0
										)
									}
									placeholder="0.00"
									step="0.01"
									min="0"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={editForm.description}
								onChange={(e) =>
									handleEditFormChange(
										"description",
										e.target.value
									)
								}
								placeholder="Description du produit"
								rows={3}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="category">Catégorie</Label>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-between"
										>
											{categories.find(
												(cat) =>
													cat.id ===
													editForm.categoryId
											)?.displayName ||
												"Sélectionner une catégorie"}
											<ChevronDown size={16} />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-full">
										{categories.map((category) => (
											<DropdownMenuItem
												key={category.id}
												onClick={() =>
													handleEditFormChange(
														"categoryId",
														category.id
													)
												}
											>
												{category.displayName}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="space-y-2">
								<Label htmlFor="condition">État</Label>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-between"
										>
											{getConditionDisplayValue(
												editForm.condition
											)}
											<ChevronDown size={16} />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-full">
										<DropdownMenuItem
											onClick={() =>
												handleEditFormChange(
													"condition",
													"new"
												)
											}
										>
											Neuf
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												handleEditFormChange(
													"condition",
													"like_new"
												)
											}
										>
											Comme neuf
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												handleEditFormChange(
													"condition",
													"good"
												)
											}
										>
											Bon état
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												handleEditFormChange(
													"condition",
													"fair"
												)
											}
										>
											État correct
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												handleEditFormChange(
													"condition",
													"poor"
												)
											}
										>
											Mauvais état
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="status">Statut</Label>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-between"
									>
										{getStatusDisplayValue(editForm.status)}
										<ChevronDown size={16} />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-full">
									<DropdownMenuItem
										onClick={() =>
											handleEditFormChange(
												"status",
												"active"
											)
										}
									>
										Actif
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											handleEditFormChange(
												"status",
												"pending"
											)
										}
									>
										En attente
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											handleEditFormChange(
												"status",
												"sold"
											)
										}
									>
										Vendu
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						<div className="space-y-2">
							<Label htmlFor="images">
								URLs des images (séparées par des virgules)
							</Label>
							<Input
								id="images"
								value={editForm.imagesUrl.join(", ")}
								onChange={(e) =>
									handleEditFormChange(
										"imagesUrl",
										e.target.value
											.split(",")
											.map((url) => url.trim())
											.filter((url) => url)
									)
								}
								placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
							/>
						</div>
					</div>
					<div className="flex justify-between">
						<Button variant="outline" onClick={closeEditModal}>
							<X size={16} className="mr-2" />
							Annuler
						</Button>
						<Button onClick={handleUpdateProduct}>
							Enregistrer les modifications
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Shipping Proof Verification Modal */}
			<Dialog
				open={isShippingProofModalOpen}
				onOpenChange={setIsShippingProofModalOpen}
			>
				<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Package className="h-5 w-5" />
							Vérification des expéditions
						</DialogTitle>
						<DialogDescription>
							Vérifiez les preuves d&apos;expédition soumises pour
							ce produit
						</DialogDescription>
					</DialogHeader>

					{loadingProofs ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
							<p className="mt-2 text-gray-600">
								Chargement des preuves...
							</p>
						</div>
					) : shippingProofs.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							<Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
							<p>
								Aucune preuve d&apos;expédition trouvée pour ce
								produit
							</p>
						</div>
					) : (
						<div className="space-y-6">
							{(() => {
								// Créer une Map pour optimiser les recherches de paiements
								const paymentsMap = new Map(
									payments.map((payment) => [
										payment.id,
										payment,
									])
								);

								return shippingProofs.map((proof) => {
									const payment = paymentsMap.get(
										proof.paymentId
									);

									return (
										<Card
											key={proof.id}
											className="border-l-4 border-l-orange-500"
										>
											<CardHeader>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														{getProofStatusIcon(
															proof.status
														)}
														<div>
															<h3 className="font-semibold">
																Preuve
																d&apos;expédition
																#
																{proof.id.slice(
																	-6
																)}
															</h3>
															<p className="text-sm text-gray-600">
																Paiement:{" "}
																{proof.paymentId.slice(
																	-6
																)}{" "}
																-{" "}
																{
																	payment?.amount
																}
																€
															</p>
														</div>
													</div>
													<Badge
														className={getProofStatusColor(
															proof.status
														)}
													>
														{getProofStatusLabel(
															proof.status
														)}
													</Badge>
												</div>
											</CardHeader>
											<CardContent className="space-y-4">
												{/* Informations de la transaction */}
												<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
													<div>
														<h4 className="font-medium mb-2">
															Acheteur
														</h4>
														<p className="text-sm">
															{
																payment?.buyer
																	.username
															}
														</p>
														<p className="text-sm text-gray-600">
															{
																payment?.buyer
																	.email
															}
														</p>
													</div>
													<div>
														<h4 className="font-medium mb-2">
															Vendeur
														</h4>
														<p className="text-sm">
															{
																payment?.seller
																	.username
															}
														</p>
														<p className="text-sm text-gray-600">
															{
																payment?.seller
																	.email
															}
														</p>
													</div>
												</div>

												{/* Numéro de suivi */}
												<div className="p-4 border rounded-lg">
													<div className="flex items-center gap-2 mb-2">
														<Truck className="h-4 w-4 text-blue-600" />
														<h4 className="font-medium">
															Numéro de suivi
														</h4>
													</div>
													<code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
														{
															proof.proofData
																.trackingNumber
														}
													</code>
												</div>

												{/* Photos des preuves */}
												<div className="grid grid-cols-2 gap-4">
													<div className="space-y-2">
														<div className="flex items-center gap-2">
															<Receipt className="h-4 w-4 text-green-600" />
															<h4 className="font-medium">
																Reçu
																d&apos;affranchissement
															</h4>
														</div>
														<div className="border rounded-lg overflow-hidden">
															{/* eslint-disable-next-line @next/next/no-img-element */}
															<img
																src={
																	proof
																		.proofData
																		.receiptImageUrl
																}
																alt="Reçu d'affranchissement"
																className="w-full h-48 object-cover"
															/>
														</div>
													</div>
													<div className="space-y-2">
														<div className="flex items-center gap-2">
															<Package className="h-4 w-4 text-blue-600" />
															<h4 className="font-medium">
																Photo du colis
															</h4>
														</div>
														<div className="border rounded-lg overflow-hidden">
															{/* eslint-disable-next-line @next/next/no-img-element */}
															<img
																src={
																	proof
																		.proofData
																		.packageImageUrl
																}
																alt="Photo du colis"
																className="w-full h-48 object-cover"
															/>
														</div>
													</div>
												</div>

												{/* Description */}
												{proof.proofData
													.description && (
													<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
														<h4 className="font-medium mb-2">
															Description du
															vendeur
														</h4>
														<p className="text-sm text-gray-700">
															{
																proof.proofData
																	.description
															}
														</p>
													</div>
												)}

												{/* Informations temporelles */}
												<div className="text-sm text-gray-600 space-y-1">
													<p>
														Soumise le:{" "}
														{new Date(
															proof.submittedAt
														).toLocaleDateString(
															"fr-FR",
															{
																day: "numeric",
																month: "long",
																year: "numeric",
																hour: "2-digit",
																minute: "2-digit",
															}
														)}
													</p>
													{proof.verifiedAt && (
														<p>
															Vérifiée le:{" "}
															{new Date(
																proof.verifiedAt
															).toLocaleDateString(
																"fr-FR",
																{
																	day: "numeric",
																	month: "long",
																	year: "numeric",
																	hour: "2-digit",
																	minute: "2-digit",
																}
															)}
														</p>
													)}
												</div>

												{/* Actions de vérification */}
												{proof.status ===
													"pending_verification" && (
													<div className="flex gap-2 pt-4 border-t">
														<Button
															onClick={() =>
																handleVerifyProof(
																	proof.id,
																	"verified"
																)
															}
															className="flex items-center gap-2"
														>
															<CheckCircle className="h-4 w-4" />
															Valider la preuve
														</Button>
														<Button
															variant="destructive"
															onClick={() =>
																handleVerifyProof(
																	proof.id,
																	"rejected"
																)
															}
															className="flex items-center gap-2"
														>
															<AlertCircle className="h-4 w-4" />
															Rejeter la preuve
														</Button>
													</div>
												)}
											</CardContent>
										</Card>
									);
								});
							})()}
						</div>
					)}

					<div className="flex justify-end pt-4 border-t">
						<Button
							variant="outline"
							onClick={closeShippingProofModal}
						>
							<X size={16} className="mr-2" />
							Fermer
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
