"use client";
import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import CategoriesNavbar from "@/features/category/CategoriesNavbar";
import CategoryCard from "@/features/category/CategoryCard";
import Banner from "@/features/home/Banner";
import ProductCard from "@/features/product/ProductCard";
import { Category, Product } from "@prisma/client";
import { useEffect, useState } from "react";

/**
 * The main Home page component for the application.
 *
 * Renders the global Header and Footer, a categories navigation bar,
 * a banner, a section displaying a feed of product cards, and a section
 * showcasing top category cards. Product and category cards are currently
 * rendered with example static data and should be replaced with dynamic data.
 *
 * @returns {JSX.Element} The rendered Home page.
 */
export default function Home(): JSX.Element {
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	
	useEffect(() => {
		const fetchProducts = async () => {
			const response = await fetch("/api/products/featured");
			const data = await response.json();
			setProducts(data);
		};

		const fetchCategories = async () => {
			const response = await fetch("/api/categories/featured");
			const data = await response.json();
			setCategories(data);
		};

		fetchProducts();
		fetchCategories();
	}, []);

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
						{/*TODO: Example product cards, replace with dynamic data as needed */}
						{products.length > 0 ? (
							products.map((product) => (
								<ProductCard
									key={product.id}
									title={product.title}
									description={product.description}
									price={product.price}
									imageUrl={product.imagesUrl[0]}
									category={product.categoryId}
									productId={product.id}
								/>
							))
						) : (
							<p>Aucun produit trouvé ...</p>
						)}
					</div>
				</section>
				<section className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full">
					<h2 className="text-2xl font-bold pb-6">Top catégories</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
						{/*TODO: Example category cards, replace with dynamic data as needed */}
						{categories.length > 0 ? (
							categories.map((category) => (
								<CategoryCard
									key={category.id}
									displayName={category.displayName}
									imageUrl={category.imageUrl}
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
