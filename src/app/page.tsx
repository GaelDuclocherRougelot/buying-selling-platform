import ProductCard from "@/features/products/ProductCard";

export default function Home() {
	return (
		<main className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10">
			<h2 className="text-2xl font-bold pb-6">Fil d&apos;actualités</h2>
			<section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-8">
				<ProductCard
					title="Product 1"
					description="Description"
					price="100"
					imageUrl=""
				/>
			</section>
		</main>
	);
}
