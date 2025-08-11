"use client";

import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DeleteProductModal, EditProductModal } from "./modals";
import { Product } from "./types";

const columns: ColumnDef<Product>[] = [
	{
		accessorKey: "title",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Titre
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => (
			<div className="font-medium">{row.getValue("title")}</div>
		),
	},
	{
		accessorKey: "price",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Prix
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("price"));
			const formatted = new Intl.NumberFormat("fr-FR", {
				style: "currency",
				currency: "EUR",
			}).format(amount);

			return <div className="font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "status",
		header: "Statut",
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<div className="flex items-center">
					{status === "active" ? (
						<span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
							Actif
						</span>
					) : status === "inactive" ? (
						<span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
							Inactif
						</span>
					) : status === "pending" ? (
						<span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
							En attente de validation
						</span>
					) : status === "sold" ? (
						<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
							Vendu
						</span>
					) : status === "rejected" ? (
						<span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
							Rejeté
						</span>
					) : status === "pending_shipping_validation" ? (
						<span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
							En attente des preuves d&apos;expédition
						</span>
					) : status === "pending_buyer_validation" ? (
						<span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
							En attente de validation acheteur
						</span>
					) : (
						<span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
							{status}
						</span>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: "category",
		header: "Catégorie",
		cell: ({ row }) => {
			const category = row.getValue("category") as {
				displayName: string;
			};
			return <div>{category.displayName}</div>;
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() =>
						column.toggleSorting(column.getIsSorted() === "asc")
					}
				>
					Date de création
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const date = new Date(row.getValue("createdAt"));
			return <div>{date.toLocaleDateString("fr-FR")}</div>;
		},
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			const product = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Ouvrir le menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<Link
								href={`/products/${product.category.id}/${product.id}`}
							>
								Voir l&apos;annonce
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => row.original.onEditClick?.(product)}
							className="cursor-pointer"
						>
							Modifier l&apos;annonce
						</DropdownMenuItem>
						{(product.status === "active" ||
							product.status === "inactive") && (
							<DropdownMenuItem
								onClick={() =>
									row.original.onToggleStatusClick?.(product)
								}
								className="cursor-pointer"
							>
								{product.status === "active"
									? "Désactiver"
									: "Activer"}{" "}
								l&apos;annonce
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							onClick={() =>
								row.original.onDeleteClick?.(product)
							}
							variant="destructive"
							className="cursor-pointer"
						>
							Supprimer l&apos;annonce
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

export function ProductsTable() {
	const { data: session } = useSession();
	const [data, setData] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(
		null
	);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	useEffect(() => {
		const fetchProducts = async () => {
			if (!session?.user?.id) return;

			try {
				const response = await apiFetch(
					`/api/products/user/${session.user.id}`
				);
				if (response.ok) {
					const products = await response.json();
					// Ajouter la fonction onEditClick à chaque produit
					const productsWithEditHandler = products.map(
						(product: Product) => ({
							...product,
							onEditClick: (product: Product) => {
								setSelectedProduct(product);
								setEditDialogOpen(true);
							},
							onDeleteClick: (product: Product) => {
								setSelectedProduct(product);
								setDeleteDialogOpen(true);
							},
							onToggleStatusClick: (product: Product) => {
								handleToggleStatus(product);
							},
						})
					);
					setData(productsWithEditHandler);
				}
			} catch (error) {
				console.error("Error fetching products:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, [session?.user?.id]);

	const handleSaveProduct = async (updatedProduct: Partial<Product>) => {
		if (!selectedProduct) return;

		try {
			const response = await apiFetch(
				`/api/products/${selectedProduct.id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(updatedProduct),
				}
			);

			if (response.ok) {
				// Mettre à jour les données locales
				setData((prevData) =>
					prevData.map((product) =>
						product.id === selectedProduct.id
							? { ...product, ...updatedProduct }
							: product
					)
				);
				console.log("Produit mis à jour avec succès");
			} else {
				console.error("Erreur lors de la mise à jour du produit");
			}
		} catch (error) {
			console.error("Erreur lors de la mise à jour du produit:", error);
		}
	};

	const handleDeleteProduct = (product: Product) => {
		// Remove the product from the local state
		setData((prevData) => prevData.filter((p) => p.id !== product.id));
	};

	const handleToggleStatus = async (product: Product) => {
		if (!product) return;

		const newStatus = product.status === "active" ? "inactive" : "active";

		try {
			const response = await apiFetch(`/api/products/${product.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status: newStatus }),
			});

			if (response.ok) {
				// Mettre à jour les données locales
				setData((prevData) =>
					prevData.map((p) =>
						p.id === product.id ? { ...p, status: newStatus } : p
					)
				);
				console.log(`Statut mis à jour avec succès: ${newStatus}`);
			} else {
				console.error("Erreur lors de la mise à jour du statut");
			}
		} catch (error) {
			console.error("Erreur lors de la mise à jour du statut:", error);
		}
	};

	const table = useReactTable({
		data,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	if (loading) {
		return <div>Chargement de vos annonces...</div>;
	}

	return (
		<div className="w-full">
			<div className="flex items-center py-4">
				<Input
					placeholder="Filtrer par titre..."
					value={
						(table
							.getColumn("title")
							?.getFilterValue() as string) ?? ""
					}
					onChange={(event) =>
						table
							.getColumn("title")
							?.setFilterValue(event.target.value)
					}
					className="max-w-sm"
				/>
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext()
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && "selected"
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									Aucun produit trouvé.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} sur{" "}
					{table.getFilteredRowModel().rows.length} ligne(s)
					sélectionnée(s).
				</div>
				<div className="space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Précédent
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Suivant
					</Button>
				</div>
			</div>

			<EditProductModal
				product={selectedProduct}
				isOpen={editDialogOpen}
				onClose={() => {
					setEditDialogOpen(false);
					setSelectedProduct(null);
				}}
				onSave={handleSaveProduct}
			/>

			<DeleteProductModal
				product={selectedProduct}
				isOpen={deleteDialogOpen}
				onClose={() => {
					setDeleteDialogOpen(false);
					setSelectedProduct(null);
				}}
				onConfirm={handleDeleteProduct}
			/>
		</div>
	);
}
