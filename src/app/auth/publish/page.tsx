"use client";
import Header from "@/components/global/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { ProductWithCategory } from "@/types/product";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// Form type that overrides imagesUrl to be File[] for upload handling
type ProductFormData = Omit<ProductWithCategory, "imagesUrl"> & {
	imagesUrl: File[];
	category: string; // Add category field for form handling
	delivery: string;
	deliveryPrice: number;
	city: string;
};

const CreateProductPage = () => {
	const [categories, setCategories] = useState<
		Array<{ id: string; name: string; displayName: string }>
	>([]);

	const [delivery, setDelivery] = useState<string>("");
	const [cityOptions, setCityOptions] = useState<
		Array<{ id: string; name: string; postalCode: string }>
	>([]);

	const { data: session } = useSession();
	const currentUser = session?.user;

	// Fetch categories from /api/category on mount
	useEffect(() => {
		apiFetch("/api/categories")
			.then((res) => res.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setCategories(data);
				}
			})
			.catch(() => setCategories([]));
	}, []);

	const handleCityChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		// Debounce API call to avoid calling on every keystroke
		setCityOptions([]);
		const city = e.target.value;

		// Store the timeout id on the window object or useRef if in a component
		if (
			(window as unknown as { __cityTimeout: NodeJS.Timeout })
				.__cityTimeout
		) {
			clearTimeout(
				(window as unknown as { __cityTimeout: NodeJS.Timeout })
					.__cityTimeout
			);
		}
		(window as unknown as { __cityTimeout: NodeJS.Timeout }).__cityTimeout =
			setTimeout(async () => {
				if (!city) return;
				console.log(city);
				const response = await apiFetch(`/api/geoapify?text=${city}`);
				const data = await response.json();
				console.log(data);
				setCityOptions(
					data.features.map(
						(feature: {
							properties: {
								address_line1: string;
								name: string;
								postcode: string;
							};
						}) => ({
							id:
								feature.properties.address_line1 ||
								feature.properties.name,
							name:
								feature.properties.address_line1 ||
								feature.properties.name,
							postalCode: feature.properties.postcode,
						})
					)
				);
			}, 500); // 500ms debounce
	};

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

		if (data.imagesUrl.length > 0) {
			const formData = new FormData();
			// Append each file individually
			data.imagesUrl.forEach((file) => {
				formData.append("files", file);
			});

			const uploadResponse = await apiFetch(
				"/api/upload/product-pictures",
				{
					method: "POST",
					body: formData,
				}
			);

			if (!uploadResponse.ok) {
				console.error("Upload failed");
				return;
			}

			const images = await uploadResponse.json();

			const { category, ...productData } = data;

			const formatedData = {
				...productData,
				price: Number(productData.price),
				imagesUrl: images.urls,
				categoryId: category,
				ownerId: currentUser?.id,
				deliveryPrice: productData.deliveryPrice
					? Number(productData.deliveryPrice)
					: 0,
			};

			console.log(formatedData);
			const response = await apiFetch("/api/products", {
				method: "POST",
				body: JSON.stringify(formatedData),
			});

			if (!response.ok) {
				console.error("Product creation failed");
				return;
			}
		}

		reset();
		redirect(`/auth/profile`);
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
									required
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
									required
								/>
								{errors.description && (
									<span className="text-xs text-red-500">
										La description est requise.
									</span>
								)}
							</div>

							<div className="flex flex-col gap-2">
								<label htmlFor="category">Catégorie</label>
								<select
									id="category"
									{...register("category")}
									required
								>
									<option value="">
										Sélectionnez une catégorie
									</option>
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
									<option value="">
										Sélectionnez un état
									</option>
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
							<div className="flex flex-col gap-2 w-fit">
								<label htmlFor="city">Ville</label>
								<Input
									onChange={handleCityChange}
									placeholder="ex: Paris"
								/>
								<select
									id="city"
									{...register("city")}
									onChange={(e) => {
										setValue("city", e.target.value);
									}}
									required
								>
									{cityOptions.map((option, index) => (
										<option
											key={`${option.name}-${index}`}
											value={`${option.name} ${option.postalCode ? `(${option.postalCode})` : ""}`}
										>
											{option.name} &nbsp;
											{option.postalCode
												? `(${option.postalCode})`
												: ""}
										</option>
									))}
								</select>
							</div>
							<div className="flex flex-col gap-2 w-fit">
								<label htmlFor="delivery">
									Type de livraison
								</label>
								<p className="text-xs text-gray-500">
									Dans le cas d&apos;une expédition, le
									vendeur devra se procurer un colis et le
									poster sur une plateforme d&apos;expédition:{" "}
									(ex: Colissimo, Chronopost, etc.)
								</p>
								<select
									id="delivery"
									{...register("delivery")}
									onChange={(e) =>
										setDelivery(e.target.value)
									}
									required
								>
									<option value="">
										Sélectionnez une option de livraison
									</option>
									<option value="pickup">
										Retrait en point relais
									</option>
									<option value="delivery">
										Livraison à domicile
									</option>
									<option value="in-person">
										Remise en main propre
									</option>
								</select>
							</div>
							{delivery === "delivery" && (
								<div className="flex flex-col gap-2 w-fit">
									<label htmlFor="deliveryPrice">
										Poids du colis (selon la grille
										tarifaire la poste pour une livraison à
										domicile)
									</label>
									<select
										id="deliveryPrice"
										{...register("deliveryPrice")}
										required
									>
										<option value="">
											Sélectionnez un poids
										</option>
										<option value="5.25">
											250 g (5,25€)
										</option>
										<option value="7.25">
											500 g (7,25€)
										</option>
										<option value="8.65">
											750 g (8,65€)
										</option>
										<option value="9.40">
											1 kg (9,40€)
										</option>
										<option value="10.70">
											2 kg (10,70€)
										</option>
										<option value="16.60">
											5 kg (16,60€)
										</option>
										<option value="24.20">
											10 kg (24,20€)
										</option>
										<option value="30.55">
											15 kg (30,55€)
										</option>
										<option value="37.85">
											30 kg (37,85€)
										</option>
									</select>
								</div>
							)}
							{delivery === "pickup" && (
								<div className="flex flex-col gap-2 w-full">
									<label htmlFor="deliveryPrice">
										Poids du colis (selon la grille
										tarifaire la poste pour un retrait en
										point relais)
									</label>
									<select
										id="deliveryPrice"
										{...register("deliveryPrice")}
										required
									>
										<option value="">
											Sélectionnez un poids
										</option>
										<option value="4.55">
											250 g (4,55€)
										</option>
										<option value="6.95">
											500 g (6,95€)
										</option>
										<option value="7.95">
											750 g (7,95€)
										</option>
										<option value="8.70">
											1 kg (8,70€)
										</option>
										<option value="10.00">
											2 kg (10,00€)
										</option>
										<option value="15.90">
											5 kg (15,90€)
										</option>
									</select>
								</div>
							)}
							<div className="flex flex-col gap-2">
								<label htmlFor="price">Prix</label>
								<p className="text-xs text-gray-500">
									Vous pouvez adapter le prix de votre annonce
									en fonction du poids du colis, si vous
									souhaitez que l&apos;acheteur paye la
									livraison.
								</p>
								<Input
									id="price"
									type="number"
									min={0}
									placeholder="Prix"
									required
									{...register("price", { min: 0 })}
								/>
								{errors.price && (
									<span className="text-xs text-red-500">
										Le prix est requis.
									</span>
								)}
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
