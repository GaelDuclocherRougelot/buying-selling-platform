import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { Category } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface ProductCardProps {
	title: string;
	description: string | null;
	price: number;
	imageUrl: string;
	category: Category;
	productId: string;
}

/**
 * ProductCard component displays a card with product details.
 * It includes an image, title, description, price, and links to the product page.
 *
 * @param {ProductCardProps} props - Component properties
 * @returns {JSX.Element} The ProductCard component
 */
const ProductCard: React.FC<ProductCardProps> = ({
	title,
	description,
	price,
	imageUrl,
	category,
	productId,
}) => {
	return (
		<Card className="w-full max-w-[18rem] p-0 gap-0 pb-4 relative group overflow-hidden">
			<div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<FavoriteButton
					productId={productId}
					size="sm"
					className="cursor-pointer"
				/>
			</div>
			<Link
				href={`/products/${category?.id || "uncategorized"}/${productId}`}
				className="no-underline"
			>
				<CardHeader className="p-0 h-72">
					<Image
						src={imageUrl || "/images/product_default.webp"}
						alt={title}
						width={300}
						height={300}
						className="w-full h-72 rounded-t-md object-cover"
					/>
				</CardHeader>
				<CardContent className="border-t pt-4">
					<CardTitle className="text-2xl font-bold">
						{title}
					</CardTitle>
					<CardDescription>{description}</CardDescription>
					<p className="text-xl font-extrabold mt-2">{price}€</p>
				</CardContent>
			</Link>
		</Card>
	);
};

export default ProductCard;
