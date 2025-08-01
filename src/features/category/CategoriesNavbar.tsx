"use client";

import { cn } from "@/lib/utils"; // Assuming you have a utility for className concatenation
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * CategoriesNavbar component displays a navigation bar for categories.
 * It includes a list of categories and a button to navigate to the "All Categories" page.
 */
export default function CategoriesNavbar() {
	const [isVisible, setIsVisible] = useState(false);

	const handleScroll = () => {
		if (typeof window !== "undefined") {
			setIsVisible(window.scrollY > 50);
		}
	};

	useEffect(() => {
		if (typeof window !== "undefined") {
			window.addEventListener("scroll", handleScroll);
			return () => {
				window.removeEventListener("scroll", handleScroll);
			};
		}
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
					<Link href="/categories">Toutes les catégories</Link>
				</li>
			</ul>
		</nav>
	);
}
