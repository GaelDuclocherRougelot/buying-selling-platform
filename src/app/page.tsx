import Header from "@/components/global/Header";
import CategoriesNavbar from "@/features/categories/CategoriesNavbar";
import CategoryCard from "@/features/categories/CategoryCard";
import Banner from "@/features/home/Banner";
import ProductCard from "@/features/products/ProductCard";

export default function Home() {
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
						<ProductCard
							title="Product 1"
							description="Description"
							price="100"
							imageUrl=""
						/>
					</div>
				</section>
				<section className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full">
					<h2 className="text-2xl font-bold pb-6">Top catégories</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
						<CategoryCard title="Category 1" imageUrl="" />
					</div>
				</section>
			</main>
		</>
	);
}
