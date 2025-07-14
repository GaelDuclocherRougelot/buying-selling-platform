"use client";
import Header from "@/components/global/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductWithCategory } from "@/types/product";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Form type that overrides imagesUrl to be File[] for upload handling
type ProductFormData = Omit<ProductWithCategory, "imagesUrl"> & {
	imagesUrl: File[];
};

const CreateProductPage = () => {
	// const [imagePreview, setImagePreview] = useState<Array<string>>(
	// 	[]
	// );

	const [categories, setCategories] = useState<
		Array<{ id: string; name: string; displayName: string }>
	>([]);

	// Fetch categories from /api/category on mount
	useEffect(() => {
		fetch("/api/categories")
			.then((res) => res.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setCategories(data);
				}
			})
			.catch(() => setCategories([]));
	}, []);

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
		reset,
	} = useForm<ProductFormData>();

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			const fileArray = Array.from(files);
			setValue("imagesUrl", fileArray); // Store File objects instead of data URLs
		} else {
			setValue("imagesUrl", []);
		}
	};

	const onSubmit = async (data: ProductFormData) => {
		console.log(data);

		if (data.imagesUrl && data.imagesUrl.length > 0) {
			const formData = new FormData();
			// Append each file individually
			data.imagesUrl.forEach((file) => {
				formData.append("files", file);
			});

			const uploadResponse = await fetch("/api/upload/product-pictures", {
				method: "POST",
				body: formData,
			});

			if (!uploadResponse.ok) {
				console.error("Upload failed");
				return;
			}

			const images = await uploadResponse.json();

			const { categoryId, ...productData } = data;

			const formatedData = {
				...productData,
				price: Number(productData.price),
				imagesUrl: images.urls,
				categoryId: categoryId,
			};

			console.log(formatedData);
			const response = await fetch("/api/products", {
				method: "POST",
				body: JSON.stringify(formatedData),
			});

			if (!response.ok) {
				console.error("Product creation failed");
				return;
			}
		}

		reset();
	};

	return (
		<>
			<Header />
			<main className="flex flex-col items-center justify-center p-0">
				<section className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full flex flex-col gap-6">
					<Card className="flex flex-col gap-10 w-full max-w-[600px] h-fit mx-auto px-6">
						<h1>Créer une annonce</h1>

						<form
							className="flex flex-col gap-6"
							onSubmit={handleSubmit(onSubmit)}
						>
							<div className="flex flex-col gap-2">
								<label htmlFor="title">Titre</label>
								<Input
									id="title"
									placeholder="ex: Table à manger"
									{...register("title")}
								/>
								{errors.title && (
									<span className="text-xs text-red-500">
										Le titre est requis.
									</span>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="description">Description</label>
								<Textarea
									id="description"
									placeholder="ex: Table à manger pour deux personnes en bon état."
									{...register("description")}
								/>
								{errors.description && (
									<span className="text-xs text-red-500">
										La description est requise.
									</span>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="price">Prix</label>
								<Input
									id="price"
									type="number"
									min={0}
									placeholder="Prix"
									{...register("price", { min: 0 })}
								/>
								{errors.price && (
									<span className="text-xs text-red-500">
										Le prix est requis.
									</span>
								)}
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="category">Catégorie</label>
								<select id="category" {...register("categoryId")}>
									<option value="">Sélectionnez une catégorie</option>
									{categories.map((category) => (
										<option
											key={category.id}
											value={category.id}
										>
											{category.displayName}
										</option>
									))}
								</select>
							</div>
							<div className="flex flex-col gap-2">
								<label htmlFor="condition">État</label>
								<select
									id="condition"
									{...register("condition")}
								>
									<option value="">Sélectionnez un état</option>
									<option value="pristine">Neuf</option>
									<option value="good">Bon état</option>
									<option value="mid">État moyen</option>
									<option value="damaged">
										Mauvais état
									</option>
								</select>
							</div>
							<div className="flex flex-col gap-2 w-fit">
								<label htmlFor="image">
									Photos de l&apos;article
								</label>
								<Input
									id="image"
									type="file"
									accept="image/*"
									multiple
									onChange={handleImageChange}
									className="w-fit h-fit cursor-pointer"
								/>
							</div>
							<Button type="submit">Créer</Button>
						</form>
					</Card>
				</section>
			</main>
		</>
	);
};

export default CreateProductPage;
