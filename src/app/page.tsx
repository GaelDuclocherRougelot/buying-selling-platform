import ProductCard from "@/features/products/ProductCard";

export default function Home() {
  return (
		<main className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10">
			<ProductCard
				title="Product 1"
				description="Description"
				price="100"
				imageUrl=""
			/>
		</main>
  );
}
