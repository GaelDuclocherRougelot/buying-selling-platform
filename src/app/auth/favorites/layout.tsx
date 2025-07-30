import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";

export default function FavoritesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Header />
			<main className="flex flex-col items-center justify-center p-0 bg-white">
				{children}
			</main>
			<Footer />
		</>
	);
}
