"use client";

import { apiFetch } from "@/lib/api";
import { Category } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminProductsFilters } from "../_components/AdminProductsFilters";
import { AdminProductsHeader } from "../_components/AdminProductsHeader";
import { AdminProductsPagination } from "../_components/AdminProductsPagination";
import { AdminProductsTable } from "../_components/AdminProductsTable";
import { DeleteProductDialog } from "../_components/DeleteProductDialog";
import { EditProductModal } from "../_components/EditProductModal";
import { ShippingProofModal } from "../_components/ShippingProofModal";
import {
	EditProductForm,
	PaginationInfo,
	Payment,
	Product,
	ShippingProof,
} from "./types";

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

				if (data.products && data.pagination) {
					setProducts(data.products);
					setPagination(data.pagination);
				} else {
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
			const paymentsResponse = await apiFetch(
				`/api/admin/products/${productId}/payments`
			);
			if (paymentsResponse.ok) {
				const paymentsData = await paymentsResponse.json();
				setPayments(paymentsData);

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

	if (loading) {
		return <div>Chargement...</div>;
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<AdminProductsHeader />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<AdminProductsFilters
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					statusFilter={statusFilter}
					setStatusFilter={setStatusFilter}
				/>

				<AdminProductsTable
					products={filteredProducts}
					onEditProduct={openEditModal}
					onDeleteProduct={openDeleteDialog}
					onViewShippingProofs={openShippingProofModal}
				/>

				{pagination && (
					<AdminProductsPagination
						pagination={pagination}
						onPageChange={handlePageChange}
					/>
				)}
			</div>

			<EditProductModal
				isOpen={isEditModalOpen}
				onClose={closeEditModal}
				editForm={editForm}
				categories={categories}
				onFormChange={handleEditFormChange}
				onUpdateProduct={handleUpdateProduct}
			/>

			<ShippingProofModal
				isOpen={isShippingProofModalOpen}
				onClose={closeShippingProofModal}
				shippingProofs={shippingProofs}
				payments={payments}
				loadingProofs={loadingProofs}
				onVerifyProof={handleVerifyProof}
			/>

			<DeleteProductDialog
				productToDelete={productToDelete}
				onClose={closeDeleteDialog}
				onDelete={handleDeleteProduct}
			/>
		</div>
	);
}
