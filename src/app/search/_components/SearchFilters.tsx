"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
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

interface SearchFiltersProps {
	filters: Filters;
	onFilterChange: (filters: Partial<Filters>) => void;
	onReset: () => void;
}

interface Category {
	id: string;
	name: string;
	displayName: string;
}

export function SearchFilters({
	filters,
	onFilterChange,
	onReset,
}: SearchFiltersProps) {
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Récupération des catégories
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await fetch("/api/categories");
				if (response.ok) {
					const data = await response.json();
					setCategories(data);
				}
			} catch (error) {
				console.error(
					"Erreur lors du chargement des catégories:",
					error
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchCategories();
	}, []);

	const conditions = [
		{ value: "pristine", label: "Neuf" },
		{ value: "good", label: "Bon état" },
		{ value: "mid", label: "État moyen" },
		{ value: "damaged", label: "Mauvais état" },
	];

	const deliveryOptions = [
		{ value: "pickup", label: "Point de retrait" },
		{ value: "delivery", label: "Livraison" },
		{ value: "both", label: "Les deux" },
	];

	const sortOptions = [
		{ value: "createdAt", label: "Plus récent" },
		{ value: "price", label: "Prix" },
		{ value: "title", label: "Titre" },
	];

	const handleFilterChange = (key: keyof Filters, value: string) => {
		// Convertir les valeurs spéciales en chaînes vides pour l'API
		const apiValue = value === "all" ? "" : value;
		onFilterChange({ [key]: apiValue });
	};

	const hasActiveFilters = Object.values(filters).some(
		(value) => value && value !== "createdAt" && value !== "desc"
	);

	return (
		<Card className="sticky top-4">
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Filter className="h-5 w-5" />
						Filtres
					</CardTitle>
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onReset}
							className="text-red-600 hover:text-red-700"
						>
							<X className="h-4 w-4 mr-1" />
							Réinitialiser
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Catégorie */}
				<div className="space-y-2">
					<Label htmlFor="category">Catégorie</Label>
					<Select
						value={filters.category || "all"}
						onValueChange={(value) =>
							handleFilterChange("category", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Toutes les catégories" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								Toutes les catégories
							</SelectItem>
							{!isLoading &&
								categories.map((category) => (
									<SelectItem
										key={category.id}
										value={category.name}
									>
										{category.displayName}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</div>

				{/* État */}
				<div className="space-y-2">
					<Label htmlFor="condition">État</Label>
					<Select
						value={filters.condition || "all"}
						onValueChange={(value) =>
							handleFilterChange("condition", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Tous les états" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tous les états</SelectItem>
							{conditions.map((condition) => (
								<SelectItem
									key={condition.value}
									value={condition.value}
								>
									{condition.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Prix */}
				<div className="space-y-2">
					<Label>Prix</Label>
					<div className="grid grid-cols-2 gap-2">
						<div>
							<Input
								type="number"
								placeholder="Min"
								value={filters.minPrice}
								onChange={(e) =>
									handleFilterChange(
										"minPrice",
										e.target.value
									)
								}
								className="text-sm"
							/>
						</div>
						<div>
							<Input
								type="number"
								placeholder="Max"
								value={filters.maxPrice}
								onChange={(e) =>
									handleFilterChange(
										"maxPrice",
										e.target.value
									)
								}
								className="text-sm"
							/>
						</div>
					</div>
				</div>

				{/* Livraison */}
				<div className="space-y-2">
					<Label htmlFor="delivery">Livraison</Label>
					<Select
						value={filters.delivery || "all"}
						onValueChange={(value) =>
							handleFilterChange("delivery", value)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Toutes les options" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								Toutes les options
							</SelectItem>
							{deliveryOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Ville */}
				<div className="space-y-2">
					<Label htmlFor="city">Ville</Label>
					<Input
						type="text"
						placeholder="Entrez une ville"
						value={filters.city}
						onChange={(e) =>
							handleFilterChange("city", e.target.value)
						}
					/>
				</div>

				{/* Tri */}
				<div className="space-y-2">
					<Label htmlFor="sortBy">Trier par</Label>
					<Select
						value={filters.sortBy}
						onValueChange={(value) =>
							handleFilterChange("sortBy", value)
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{sortOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Ordre de tri */}
				<div className="space-y-2">
					<Label htmlFor="sortOrder">Ordre</Label>
					<Select
						value={filters.sortOrder}
						onValueChange={(value) =>
							handleFilterChange("sortOrder", value)
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="desc">Décroissant</SelectItem>
							<SelectItem value="asc">Croissant</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>
	);
}
