import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface ProductCardProps {
	title: string;
	description: string;
	price: string;
	imageUrl: string;
	category: string;
	productId: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
	title,
	description,
	price,
	imageUrl,
	category,
	productId,
}) => {
	return (
		<Link href={`/products/${category}/${productId}`} className="no-underline">
			<Card className="w-full max-w-[18rem] p-0 gap-0 pb-4 cursor-pointer">
				<CardHeader className="p-0 h-72">
					<Image
						src={imageUrl || "/images/product_default.webp"}
						alt={title}
						width={300}
						height={300}
						className="w-full h-72 object-cover rounded-t-md"
					/>
				</CardHeader>
				<CardContent className="border-t pt-4">
					<CardTitle className="text-2xl font-bold">
						{title}
					</CardTitle>
					<CardDescription>{description}</CardDescription>
					<p className="text-xl font-extrabold mt-2">{price}€</p>
				</CardContent>
			</Card>
		</Link>
	);
};

export default ProductCard;
