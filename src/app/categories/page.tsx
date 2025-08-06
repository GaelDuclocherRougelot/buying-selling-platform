"use client";

import Header from "@/components/global/Header";
import CategoryCard from "@/features/category/CategoryCard";
import { apiFetch } from "@/lib/api";
import { useCachedData } from "@/lib/hooks/useCache";
import { Category } from "@prisma/client";
import { toast } from "sonner";

export default function CategoriesPage() {
	const {
		data: categories = [],
		loading,
		error,
	} = useCachedData<Category[]>(
		"categories:all",
		async () => {
			const response = await apiFetch("/api/categories");
			if (!response.ok) {
				throw new Error("Failed to fetch categories");
			}
			return await response.json();
		},
		60 * 60 * 1000 // 1 heure
	);

	if (error) {
		toast.error("Erreur lors du chargement des catégories");
	}

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
					<h1 className="text-3xl font-bold text-gray-900 mb-8">
						Toutes les catégories
					</h1>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{categories?.map((category) => (
							<CategoryCard
								key={category.id}
								displayName={category.displayName}
								id={category.id}
								name={category.name}
								createdAt={category.createdAt}
								updatedAt={category.updatedAt}
								imageUrl={category.imageUrl} />
						))}
					</div>
				</div>
			</main>
		</>
	);
}
