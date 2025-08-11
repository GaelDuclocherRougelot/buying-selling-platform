import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Eye, MoreHorizontal, Package, Trash2 } from "lucide-react";
import Link from "next/link";
import { Product } from "./types";

interface AdminProductsTableProps {
	products: Product[];
	onEditProduct: (product: Product) => void;
	onDeleteProduct: (product: Product) => void;
	onViewShippingProofs: (product: Product) => void;
}

export function AdminProductsTable({
	products,
	onEditProduct,
	onDeleteProduct,
	onViewShippingProofs,
}: AdminProductsTableProps) {
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

	if (products.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				Aucun produit disponible
			</div>
		);
	}

	return (
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
					{products.map((product) => (
						<tr key={product.id} className="hover:bg-gray-50">
							<td className="border border-gray-200 px-4 py-2">
								<div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
									{product.imagesUrl &&
									product.imagesUrl.length > 0 ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={product.imagesUrl[0]}
											alt={product.title}
											className="w-16 h-16 object-cover"
										/>
									) : (
										<div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
											<span className="text-gray-500 text-xs">
												Aucune image
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
									{product.category.displayName}
								</span>
							</td>
							<td className="border border-gray-200 px-4 py-2">
								{getStatusBadge(product.status)}
							</td>
							<td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
								{new Date(
									product.createdAt
								).toLocaleDateString()}
							</td>
							<td className="border border-gray-200 px-4 py-2">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											className="h-8 w-8 p-0"
										>
											<span className="sr-only">
												Ouvrir le menu
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
													size={14}
													className="mr-2"
												/>
												Voir le produit
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												onViewShippingProofs(product)
											}
											className="cursor-pointer"
										>
											<Package
												size={14}
												className="mr-2"
											/>
											Vérifier les expéditions
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												onEditProduct(product)
											}
											className="cursor-pointer"
										>
											<Edit size={14} className="mr-2" />
											Modifier le produit
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												onDeleteProduct(product)
											}
											className="cursor-pointer text-red-600 hover:text-red-700"
										>
											<Trash2
												size={14}
												className="mr-2"
											/>
											Supprimer le produit
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
