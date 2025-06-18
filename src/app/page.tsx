import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import CategoriesNavbar from "@/features/category/CategoriesNavbar";
import CategoryCard from "@/features/category/CategoryCard";
import Banner from "@/features/home/Banner";
import ProductCard from "@/features/product/ProductCard";


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
						{/*TODO: Example product cards, replace with dynamic data as needed */}
						<ProductCard
							title="Product 1"
							description="Description"
							price="100"
							imageUrl=""
							category="decoration"
							productId="1"
						/>
					</div>
				</section>
				<section className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full">
					<h2 className="text-2xl font-bold pb-6">Top catégories</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
						{/*TODO: Example category cards, replace with dynamic data as needed */}
						<CategoryCard title="Category 1" imageUrl="" />
					</div>
				</section>
			</main>
			<Footer />
		</>
	);
}
