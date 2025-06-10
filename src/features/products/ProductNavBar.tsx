"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Assuming you have a utility for className concatenation
import { Heart } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ProductNavBar() {
	const [isVisible, setIsVisible] = useState(false);

	const handleScroll = () => {
		setIsVisible(window.scrollY > 300);
	};

	useEffect(() => {
		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return (
		<nav
			className={cn(
				"py-4 px-4 lg:px-10 flex items-center justify-between w-full fixed top-20 bg-white z-10 transition-all duration-300 ease-in-out",
				isVisible ? "translate-y-0 shadow-md" : "-translate-y-20"
			)}
		>
			<div className="flex items-center justify-between gap-4">
				<Image src="/logo.png" alt="logo" width={40} height={40} />
				<div className="flex flex-col">
					<p>Titre du produit</p>
					<p>100€</p>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<Button variant="default">Contacter le vendeur</Button>
				<Button>
					<Heart />
				</Button>
			</div>
		</nav>
	);
}
