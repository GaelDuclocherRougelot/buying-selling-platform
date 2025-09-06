"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SearchFilters } from "./SearchFilters";
import { SearchHeader } from "./SearchHeader";
import { SearchResults } from "./SearchResults";

export function SearchContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// État pour les filtres
	const [filters, setFilters] = useState({
		q: searchParams.get("q") || "",
		category: searchParams.get("category") || "",
		condition: searchParams.get("condition") || "",
		minPrice: searchParams.get("minPrice") || "",
		maxPrice: searchParams.get("maxPrice") || "",
		delivery: searchParams.get("delivery") || "",
		city: searchParams.get("city") || "",
		sortBy: searchParams.get("sortBy") || "createdAt",
		sortOrder: searchParams.get("sortOrder") || "desc",
	});

	// Fonction pour mettre à jour les paramètres d'URL
	const updateSearchParams = (newFilters: Partial<typeof filters>) => {
		const params = new URLSearchParams(searchParams);

		// Mettre à jour les paramètres
		Object.entries(newFilters).forEach(([key, value]) => {
			if (value) {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		});

		// Réinitialiser la page à 1 lors d'un nouveau filtre
		params.set("page", "1");

		router.push(`/search?${params.toString()}`);
	};

	// Fonction pour appliquer les filtres
	const applyFilters = (newFilters: Partial<typeof filters>) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
		updateSearchParams(newFilters);
	};

	// Fonction pour réinitialiser les filtres
	const resetFilters = () => {
		const newFilters = {
			q: "",
			category: "",
			condition: "",
			minPrice: "",
			maxPrice: "",
			delivery: "",
			city: "",
			sortBy: "createdAt",
			sortOrder: "desc",
		};
		setFilters(newFilters);
		updateSearchParams(newFilters);
	};

	return (
		<main className="flex flex-col items-center justify-center min-h-screen p-0 bg-gray-50">
			<div className="max-w-[85rem] mx-auto py-10 lg:py-16 px-4 lg:px-10 w-full flex flex-col gap-6">
				<SearchHeader
					query={filters.q}
					onSearch={(query) => applyFilters({ q: query })}
				/>

				<div className="flex flex-col lg:flex-row gap-4 h-full">
					{/* Filtres */}
					<SearchFilters
						filters={filters}
						onFilterChange={applyFilters}
						onReset={resetFilters}
					/>

					{/* Résultats */}
					<SearchResults
						filters={filters}
						isLoading={isLoading}
						setIsLoading={setIsLoading}
					/>
				</div>
			</div>
		</main>
	);
}
