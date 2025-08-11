"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProductCard from "@/features/product/ProductCard";
import { ProductWithCategory } from "@/types/product";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Filters {
	q: string;
	category: string;
	condition: string;
	minPrice: string;
	maxPrice: string;
	delivery: string;
	city: string;
	sortBy: string;
	sortOrder: string;
}

interface SearchResultsProps {
	filters: Filters;
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
}

interface SearchResponse {
	products: ProductWithCategory[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}

export function SearchResults({
	filters,
	isLoading,
	setIsLoading,
}: SearchResultsProps) {
	const [results, setResults] = useState<SearchResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const searchParams = useSearchParams();
	const router = useRouter();

	// Effectuer la recherche quand les filtres changent
	useEffect(() => {
		const page = parseInt(searchParams.get("page") || "1");

		// Fonction pour construire l'URL de recherche
		const buildSearchUrl = (page: number = 1) => {
			const params = new URLSearchParams();

			Object.entries(filters).forEach(([key, value]) => {
				if (value) {
					params.set(key, value);
				}
			});

			params.set("page", page.toString());
			return `/api/products/search?${params.toString()}`;
		};

		// Fonction pour effectuer la recherche
		const performSearch = async (page: number = 1) => {
			setIsLoading(true);
			setError(null);

			try {
				const url = buildSearchUrl(page);
				const response = await fetch(url);

				if (!response.ok) {
					throw new Error("Erreur lors de la recherche");
				}

				const data: SearchResponse = await response.json();
				setResults(data);
			} catch (err) {
				setError("Une erreur est survenue lors de la recherche");
				console.error("Erreur de recherche:", err);
			} finally {
				setIsLoading(false);
			}
		};
		performSearch(page);
	}, [filters, searchParams, setIsLoading]);

	// Fonction pour changer de page
	const changePage = (page: number) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", page.toString());
		router.push(`/search?${params.toString()}`);
	};

	if (isLoading) {
		return (
			<Card className="h-fit w-full">
				<CardContent className="flex items-center justify-center py-12">
					<div className="flex items-center gap-2">
						<Loader2 className="h-6 w-6 animate-spin" />
						<span>Recherche en cours...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="h-fit w-full">
				<CardContent className="flex items-center justify-center py-12">
					<div className="flex items-center gap-2 text-red-600">
						<AlertCircle className="h-6 w-6" />
						<span>{error}</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!results) {
		return null;
	}

	const { products, pagination } = results;

	return (
		<div className="space-y-6 w-full overflow-y-scroll h-full">
			{/* En-tête des résultats */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold text-gray-900">
						Résultats de recherche
					</h2>
					<p className="text-gray-600">
						{pagination.totalCount} annonce
						{pagination.totalCount !== 1 ? "s" : ""} trouvée
						{pagination.totalCount !== 1 ? "s" : ""}
					</p>
				</div>
			</div>

			{/* Résultats */}
			{products.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Search className="h-12 w-12 text-gray-400 mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							Aucun résultat trouvé
						</h3>
						<p className="text-gray-600 text-center max-w-md">
							Aucune annonce ne correspond à vos critères de
							recherche. Essayez de modifier vos filtres ou votre
							recherche.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{products.map((product) => (
						<ProductCard
							key={product.id}
							productId={product.id}
							title={product.title}
							description={product.description}
							price={product.price}
							imageUrl={product.imagesUrl[0]}
							category={product.category}
						/>
					))}
				</div>
			)}

			{/* Pagination */}
			{pagination.totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button
						variant="outline"
						onClick={() => changePage(pagination.currentPage - 1)}
						disabled={!pagination.hasPrevPage}
					>
						Précédent
					</Button>

					<span className="px-4 py-2 text-sm text-gray-600">
						Page {pagination.currentPage} sur{" "}
						{pagination.totalPages}
					</span>

					<Button
						variant="outline"
						onClick={() => changePage(pagination.currentPage + 1)}
						disabled={!pagination.hasNextPage}
					>
						Suivant
					</Button>
				</div>
			)}
		</div>
	);
}
