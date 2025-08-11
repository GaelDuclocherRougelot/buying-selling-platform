import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";

interface AdminProductsFiltersProps {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	statusFilter: string;
	setStatusFilter: (filter: string) => void;
}

export function AdminProductsFilters({
	searchTerm,
	setSearchTerm,
	statusFilter,
	setStatusFilter,
}: AdminProductsFiltersProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Produits</CardTitle>
				<CardDescription>
					Gérez les produits de votre plateforme
				</CardDescription>
			</CardHeader>
			<CardContent>
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
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
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
			</CardContent>
		</Card>
	);
}
