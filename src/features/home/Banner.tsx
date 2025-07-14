import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Banner component displays a full-screen banner section.
 * It includes a title, subtitle, and a call-to-action button.
 * 
 * @returns {JSX.Element} The Banner component
 */
export default function Banner(): JSX.Element {
	return (
		<section className="w-full h-[calc(100vh-5rem)] bg-[url('/images/banner.webp')] bg-cover bg-center flex items-center">
			<div className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full flex flex-col gap-6">
				<h1 className="text-7xl font-extrabold text-white">
					Zon<span className="text-primary">e</span>
				</h1>
				<p className="text-5xl font-bold text-white">
					Le grand nettoyage de printemps, <br /> toute l’année.
				</p>
				<Button className="w-fit text-lg py-6 cursor-pointer">
					<Link href="/auth/publish">Vendre maintenant</Link>
				</Button>
			</div>
		</section>
	);
}
