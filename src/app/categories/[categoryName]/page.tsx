"use client";

import Header from "@/components/global/Header";
import ProductCard from "@/features/product/ProductCard";
import { apiFetch } from "@/lib/api";
import { Category, Product } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ProductWithCategory = Product & {
	category: Category;
};

interface CategoryPageProps {
	params: Promise<{ categoryName: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
	const [products, setProducts] = useState<ProductWithCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [categoryName, setCategoryName] = useState<string>("");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const { categoryName } = await params;
				setCategoryName(categoryName);

				// Décoder le nom de la catégorie (car il peut contenir des caractères spéciaux)
				const decodedCategoryName = decodeURIComponent(categoryName);

				const response = await apiFetch(
					`/api/products?category=${decodedCategoryName}`
				);
				if (!response.ok) {
					throw new Error("Failed to fetch products");
				}
				const data = await response.json();
				setProducts(data);
			} catch (error) {
				console.error("Error fetching products:", error);
				toast.error("Erreur lors du chargement des produits");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [params]);

	if (loading) {
		return (
			<>
				<Header />
				<main className="flex justify-center px-4 lg:px-10 py-8">
					<div className="w-full max-w-7xl">
						<div className="text-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
							<p className="text-gray-600">
								Chargement des produits...
							</p>
						</div>
					</div>
				</main>
			</>
		);
	}

	// Formater le nom de la catégorie pour l'affichage
	const formatCategoryName = (name: string) => {
		return name
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	return (
		<>
			<Header />
			<main className="flex justify-center px-4 lg:px-10 py-8">
				<div className="w-full max-w-7xl">
					{/* Header */}
					<div className="mb-8">
						<div className="flex items-center gap-4 mb-4">
							<Link
								href="/categories"
								className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
							>
								<ArrowLeft className="h-4 w-4" />
								Retour aux catégories
							</Link>
						</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							{formatCategoryName(categoryName)}
						</h1>
						<p className="text-gray-600">
							{products.length} produit
							{products.length !== 1 ? "s" : ""} trouvé
							{products.length !== 1 ? "s" : ""}
						</p>
					</div>

					{/* Products Grid */}
					{products.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{products.map((product) => (
								<ProductCard
									key={product.id}
									title={product.title}
									description={product.description}
									price={product.price}
									imageUrl={
										product.imagesUrl[0] ||
										"/images/product_default.webp"
									}
									category={product.category}
									productId={product.id}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<p className="text-gray-600">
								Aucun produit trouvé dans cette catégorie
							</p>
						</div>
					)}
				</div>
			</main>
		</>
	);
}
