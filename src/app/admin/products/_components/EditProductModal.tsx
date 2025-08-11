import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Category } from "@prisma/client";
import { ChevronDown, X } from "lucide-react";
import { EditProductForm } from "./types";

interface EditProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	editForm: EditProductForm;
	categories: Category[];
	onFormChange: (
		field: keyof EditProductForm,
		value: string | number | string[]
	) => void;
	onUpdateProduct: () => void;
}

export function EditProductModal({
	isOpen,
	onClose,
	editForm,
	categories,
	onFormChange,
	onUpdateProduct,
}: EditProductModalProps) {
	const getStatusDisplayValue = (status: string): string => {
		switch (status) {
			case "active":
				return "Actif";
			case "pending":
				return "En attente";
			case "sold":
				return "Vendu";
			default:
				return status;
		}
	};

	const getConditionDisplayValue = (condition: string): string => {
		switch (condition) {
			case "new":
				return "Neuf";
			case "good":
				return "Bon état";
			case "mid":
				return "État moyen";
			case "damaged":
				return "Mauvais état";
			default:
				return condition;
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Modifier le produit</DialogTitle>
					<DialogDescription>
						Modifiez les informations du produit
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="title">Titre</Label>
							<Input
								id="title"
								value={editForm.title}
								onChange={(e) =>
									onFormChange("title", e.target.value)
								}
								placeholder="Titre du produit"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="price">Prix (€)</Label>
							<Input
								id="price"
								type="number"
								value={editForm.price}
								onChange={(e) =>
									onFormChange(
										"price",
										parseFloat(e.target.value) || 0
									)
								}
								placeholder="0.00"
								step="0.01"
								min="0"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={editForm.description}
							onChange={(e) =>
								onFormChange("description", e.target.value)
							}
							placeholder="Description du produit"
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="category">Catégorie</Label>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-between"
									>
										{categories.find(
											(cat) =>
												cat.id === editForm.categoryId
										)?.displayName ||
											"Sélectionner une catégorie"}
										<ChevronDown size={16} />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-full">
									{categories.map((category) => (
										<DropdownMenuItem
											key={category.id}
											onClick={() =>
												onFormChange(
													"categoryId",
													category.id
												)
											}
										>
											{category.displayName}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
						<div className="space-y-2">
							<Label htmlFor="condition">État</Label>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-between"
									>
										{getConditionDisplayValue(
											editForm.condition
										)}
										<ChevronDown size={16} />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-full">
									<DropdownMenuItem
										onClick={() =>
											onFormChange("condition", "new")
										}
									>
										Neuf
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											onFormChange(
												"condition",
												"like_new"
											)
										}
									>
										Comme neuf
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											onFormChange("condition", "good")
										}
									>
										Bon état
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											onFormChange("condition", "fair")
										}
									>
										État correct
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											onFormChange("condition", "poor")
										}
									>
										Mauvais état
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="status">Statut</Label>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-between"
								>
									{getStatusDisplayValue(editForm.status)}
									<ChevronDown size={16} />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-full">
								<DropdownMenuItem
									onClick={() =>
										onFormChange("status", "active")
									}
								>
									Actif
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										onFormChange("status", "pending")
									}
								>
									En attente
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										onFormChange("status", "sold")
									}
								>
									Vendu
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="space-y-2">
						<Label htmlFor="images">
							URLs des images (séparées par des virgules)
						</Label>
						<Input
							id="images"
							value={editForm.imagesUrl.join(", ")}
							onChange={(e) =>
								onFormChange(
									"imagesUrl",
									e.target.value
										.split(",")
										.map((url) => url.trim())
										.filter((url) => url)
								)
							}
							placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
						/>
					</div>
				</div>
				<div className="flex justify-between">
					<Button variant="outline" onClick={onClose}>
						<X size={16} className="mr-2" />
						Annuler
					</Button>
					<Button onClick={onUpdateProduct}>
						Enregistrer les modifications
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
