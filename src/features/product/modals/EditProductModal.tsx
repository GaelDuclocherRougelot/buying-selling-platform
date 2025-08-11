"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Product } from "../types";

interface EditProductModalProps {
	product: Product | null;
	isOpen: boolean;
	onClose: () => void;
	onSave: (updatedProduct: Partial<Product>) => void;
}

export function EditProductModal({
	product,
	isOpen,
	onClose,
	onSave,
}: EditProductModalProps) {
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		price: "",
		condition: "",
		imagesUrl: [] as string[],
	});
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		if (product) {
			setFormData({
				title: product.title,
				description: product.description || "",
				price: product.price.toString(),
				condition: product.condition,
				imagesUrl: product.imagesUrl || [],
			});
			setSelectedFiles([]);
		}
	}, [product]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			const fileArray = Array.from(files);
			setSelectedFiles((prev) => [...prev, ...fileArray]);
		}
	};

	const removeExistingImage = (index: number) => {
		setFormData({
			...formData,
			imagesUrl: formData.imagesUrl.filter((_, i) => i !== index),
		});
	};

	const removeNewImage = (index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsUploading(true);

		try {
			let finalImagesUrl = [...formData.imagesUrl];

			// Upload new files if any
			if (selectedFiles.length > 0) {
				const formData = new FormData();
				selectedFiles.forEach((file) => {
					formData.append("files", file);
				});

				const uploadResponse = await apiFetch(
					"/api/upload/product-pictures",
					{
						method: "POST",
						body: formData,
					}
				);

				if (uploadResponse.ok) {
					const images = await uploadResponse.json();
					finalImagesUrl = [...finalImagesUrl, ...images.urls];
				}
			}

			onSave({
				title: formData.title,
				description: formData.description,
				price: parseFloat(formData.price),
				condition: formData.condition,
				imagesUrl: finalImagesUrl,
			});
			toast.success("Annonce mise à jour avec succès");
			onClose();
		} catch (error) {
			console.error("Erreur lors de la mise à jour:", error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Modifier l&apos;annonce</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Titre
						</label>
						<Input
							value={formData.title}
							onChange={(e) =>
								setFormData({
									...formData,
									title: e.target.value,
								})
							}
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							value={formData.description}
							onChange={(e) =>
								setFormData({
									...formData,
									description: e.target.value,
								})
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							rows={3}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Prix (€)
						</label>
						<Input
							type="number"
							step="0.01"
							value={formData.price}
							onChange={(e) =>
								setFormData({
									...formData,
									price: e.target.value,
								})
							}
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							État
						</label>
						<select
							value={formData.condition}
							onChange={(e) =>
								setFormData({
									...formData,
									condition: e.target.value,
								})
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						>
							<option value="new">Neuf</option>
							<option value="good">Bon état</option>
							<option value="mid">État correct</option>
							<option value="damaged">Mauvais état</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Images
						</label>

						{/* Images existantes */}
						{formData.imagesUrl.length > 0 && (
							<div className="mb-3">
								<label className="block text-xs font-medium text-gray-600 mb-2">
									Images actuelles
								</label>
								<div className="flex flex-wrap gap-2">
									{formData.imagesUrl.map(
										(imageUrl, index) => (
											<div
												key={`existing-${index}`}
												className="w-fit relative"
											>
												<Image
													src={imageUrl}
													alt={`Image ${index + 1}`}
													className="w-80 aspect-square object-cover rounded-md border"
													width={80}
													height={80}
												/>
												<button
													type="button"
													onClick={() =>
														removeExistingImage(
															index
														)
													}
													className="absolute top-0 right-0 cursor-pointer"
												>
													<X className="w-3 h-3" />
												</button>
											</div>
										)
									)}
								</div>
							</div>
						)}

						{/* Nouvelles images sélectionnées */}
						{selectedFiles.length > 0 && (
							<div className="mb-3">
								<label className="block text-xs font-medium text-gray-600 mb-2">
									Nouvelles images
								</label>
								<div className="grid grid-cols-4 gap-2">
									{selectedFiles.map((file, index) => (
										<div
											key={`new-${index}`}
											className="relative group"
										>
											<Image
												src={URL.createObjectURL(file)}
												alt={`Nouvelle image ${index + 1}`}
												className="w-full h-20 object-cover rounded-md border"
												width={80}
												height={80}
											/>
											<button
												type="button"
												onClick={() =>
													removeNewImage(index)
												}
												className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<X className="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Input file */}
						<div className="flex flex-col gap-2 w-fit">
							<Input
								type="file"
								accept="image/*"
								multiple
								onChange={handleImageChange}
								className="w-fit h-fit cursor-pointer"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isUploading}
						>
							Annuler
						</Button>
						<Button type="submit" disabled={isUploading}>
							{isUploading ? "Enregistrement..." : "Enregistrer"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
