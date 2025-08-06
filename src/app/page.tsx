"use client";
import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import CategoriesNavbar from "@/features/category/CategoriesNavbar";
import CategoryCard from "@/features/category/CategoryCard";
import Banner from "@/features/home/Banner";
import ProductCard from "@/features/product/ProductCard";
import { apiFetch } from "@/lib/api";
import { ProductWithCategory } from "@/types/product";
import { Category } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Type pour les catégories avec le compteur de produits
type CategoryWithCount = Category & {
	_count: {
		products: number;
	};
};

/**
 * The main Home page component for the application.
 *
 * Renders the global Header and Footer, a categories navigation bar,
 * a banner, a section displaying a feed of product cards, and a section
 * showcasing top category cards. Product and category cards are loaded
 * dynamically from the API.
 *
 * @returns {JSX.Element} The rendered Home page.
 */
export default function Home(): JSX.Element {
	const [products, setProducts] = useState<ProductWithCategory[]>([]);
	const [categories, setCategories] = useState<CategoryWithCount[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				console.log("Début du chargement des données...");

				// Charger les produits en parallèle
				const [productsResponse, categoriesResponse] =
					await Promise.all([
						apiFetch("/api/products/featured"),
						apiFetch("/api/categories/featured"),
					]);

				console.log("Réponses reçues:", {
					products: productsResponse.status,
					categories: categoriesResponse.status,
				});

				if (productsResponse.ok) {
					const productsData = await productsResponse.json();
					console.log("Produits chargés:", productsData.length);
					setProducts(productsData);
				} else {
					console.error(
						"Erreur lors du chargement des produits:",
						productsResponse.status
					);
				}

				if (categoriesResponse.ok) {
					const categoriesData = await categoriesResponse.json();
					console.log("Catégories chargées:", categoriesData.length);
					console.log("Données des catégories:", categoriesData);
					setCategories(categoriesData);
				} else {
					console.error(
						"Erreur lors du chargement des catégories:",
						categoriesResponse.status
					);
					// Essayer de récupérer le texte d'erreur
					try {
						const errorText = await categoriesResponse.text();
						console.error(
							"Détails de l'erreur catégories:",
							errorText
						);
					} catch {
						console.error("Impossible de lire le texte d'erreur");
					}
				}
			} catch (error) {
				console.error("Erreur lors du chargement des données:", error);
				toast.error("Erreur lors du chargement des données");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return (
			<>
				<Header />
				<CategoriesNavbar />
				<main className="flex flex-col items-center justify-center min-h-screen p-0">
					<Banner />
					<div className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full">
						<div className="text-center py-12">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
							<p className="text-gray-600">
								Chargement des données...
							</p>
						</div>
					</div>
				</main>
				<Footer />
			</>
		);
	}

	return (
		<>
			<Header />
			<CategoriesNavbar />
			<main className="flex flex-col items-center justify-center min-h-screen p-0">
				<Banner />
				<section className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full">
					<h2 className="text-2xl font-bold pb-6">
						Fil d&apos;actualités
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
						{products && products.length > 0 ? (
							products.map((product) => (
								<ProductCard
									key={product.id}
									title={product.title}
									description={product.description}
									price={product.price}
									imageUrl={product.imagesUrl[0]}
									category={product.category}
									productId={product.id}
								/>
							))
						) : (
							<p>Aucune annonce trouvée ...</p>
						)}
					</div>
				</section>
				<section className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full">
					<h2 className="text-2xl font-bold pb-6">Top catégories</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
						{categories && categories.length > 0 ? (
							categories.map((category) => (
								<CategoryCard
									key={category.id}
									displayName={category.displayName}
									imageUrl={category.imageUrl}
									id={category.id}
									name={category.name}
									createdAt={category.createdAt}
									updatedAt={category.updatedAt}
								/>
							))
						) : (
							<p>Aucune catégorie trouvée ...</p>
						)}
					</div>
				</section>
			</main>
			<Footer />
		</>
	);
}
