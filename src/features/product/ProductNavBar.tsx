"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Assuming you have a utility for className concatenation
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProductNavBar({
	image,
	title,
	price,
	chatId,
}: {
	image: string;
	title: string;
	price: number;
	chatId: string;
}) {
	const [isVisible, setIsVisible] = useState(false);

	const handleScroll = () => {
		setIsVisible(window.scrollY > 130);
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
				"py-4 px-4 lg:px-10 flex items-center justify-between w-full fixed top-20 bg-background z-10 transition-all duration-300 ease-in-out",
				isVisible ? "translate-y-0 shadow-md" : "-translate-y-20"
			)}
		>
			<div className="flex items-center justify-between gap-4 w-full max-w-[80rem] mx-auto">
				<div className="flex items-center justify-between gap-4">
					<Image src={image} alt="logo" width={64} height={64} />
					<div className="flex flex-col">
						<p className="font-bold">{title}</p>
						<p>{price}€</p>
					</div>
				</div>
				<div className="flex items-center gap-4">
					<Link href={`/auth/chat/${chatId}`}>
						<Button variant="default">Contacter le vendeur</Button>
					</Link>
					<Button>
						<Heart />
					</Button>
				</div>
			</div>
		</nav>
	);
}
