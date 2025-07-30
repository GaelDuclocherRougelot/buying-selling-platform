"use client";

import Header from "@/components/global/Header";
import CategoryCard from "@/features/category/CategoryCard";
import { apiFetch } from "@/lib/api";
import { Category } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await apiFetch("/api/categories");
				if (!response.ok) {
					throw new Error("Failed to fetch categories");
				}
				const data = await response.json();
				setCategories(data);
			} catch (error) {
				console.error("Error fetching categories:", error);
				toast.error("Erreur lors du chargement des catégories");
			} finally {
				setLoading(false);
			}
		};

		fetchCategories();
	}, []);

	if (loading) {
		return (
			<>
				<Header />
				<main className="flex justify-center px-4 lg:px-10 py-8">
					<div className="w-full max-w-7xl">
						<div className="text-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
							<p className="text-gray-600">
								Chargement des catégories...
							</p>
						</div>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<Header />
			<main className="flex justify-center px-4 lg:px-10 py-8">
				<div className="w-full max-w-7xl">
					{/* Header */}
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Toutes les catégories
						</h1>
						<p className="text-gray-600">
							Découvrez toutes nos annonces organisées par
							catégories
						</p>
					</div>

					{/* Categories Grid */}
					{categories.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
							{categories.map((category) => (
								<CategoryCard key={category.id} {...category} />
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<p className="text-gray-600">
								Aucune catégorie trouvée
							</p>
						</div>
					)}
				</div>
			</main>
		</>
	);
}
