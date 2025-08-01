"use client";

import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SearchFilters } from "./_components/SearchFilters";
import { SearchHeader } from "./_components/SearchHeader";
import { SearchResults } from "./_components/SearchResults";

export default function SearchPage() {
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
		<>
			<Header />
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-8">
					<SearchHeader
						query={filters.q}
						onSearch={(query) => applyFilters({ q: query })}
					/>

					<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
						{/* Filtres */}
						<div className="lg:col-span-1">
							<SearchFilters
								filters={filters}
								onFilterChange={applyFilters}
								onReset={resetFilters}
							/>
						</div>

						{/* Résultats */}
						<div className="lg:col-span-3">
							<SearchResults
								filters={filters}
								isLoading={isLoading}
								setIsLoading={setIsLoading}
							/>
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</>
	);
}
