import Header from "@/components/global/Header";
import ProductImageCarousel from "@/features/products/ProductImageCarousel";
import ProductNavBar from "@/features/products/ProductNavBar";

export default async function Home(props: {
	params: Promise<{ category: string; productId: string }>;
}) {
	const params = await props.params;
	return (
		<>
			<Header />
			<ProductNavBar />
			<main className="flex flex-col items-center justify-center min-h-screen p-0">
				<section>
					<ProductImageCarousel />
				</section>
			</main>
		</>
	);
}
