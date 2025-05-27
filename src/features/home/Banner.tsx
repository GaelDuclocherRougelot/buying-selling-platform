import { Button } from "@/components/ui/button";

export default function Banner() {
	return (
		<section className="w-full h-[calc(100vh-5rem)] bg-[url('/images/banner.webp')] bg-cover bg-center flex items-center">
			<div className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full flex flex-col gap-6">
				<h1 className="text-7xl font-extrabold text-white">
					Zon<span className="text-primary">e</span>
				</h1>
				<p className="text-5xl font-bold text-white">
					Le grand nettoyage de printemps, <br /> toute l’année.
				</p>
				<Button className="w-fit text-xl py-6 cursor-pointer">
					Vendre maintenant
				</Button>
			</div>
		</section>
	);
}
