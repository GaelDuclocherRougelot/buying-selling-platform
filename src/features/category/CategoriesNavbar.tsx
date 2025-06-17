"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"; // Assuming you have a utility for className concatenation

export default function CategoriesNavbar() {
	const [isVisible, setIsVisible] = useState(false);

	const handleScroll = () => {
		setIsVisible(window.scrollY > 50);
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
			<ul className="flex items-center justify-center w-full gap-4 max-w-[85rem] mx-auto">
				<li className="border-b">
					<Link href="/categories/all">Toutes les catégories</Link>
				</li>
			</ul>
		</nav>
	);
}
