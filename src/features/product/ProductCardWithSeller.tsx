import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import FavoriteButton from "@/components/ui/FavoriteButton";
import SellerLink from "@/components/ui/SellerLink";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface ProductCardWithSellerProps {
	title: string;
	description: string | null;
	price: number;
	imageUrl: string;
	category: string;
	productId: string;
	seller?: {
		id: string;
		username: string | null;
		name: string;
	};
}

/**
 * ProductCardWithSeller component displays a card with product details and seller information.
 * It includes an image, title, description, price, seller link, and links to the product page.
 *
 * @param {ProductCardWithSellerProps} props - Component properties
 * @returns {JSX.Element} The ProductCardWithSeller component
 */
const ProductCardWithSeller: React.FC<ProductCardWithSellerProps> = ({
	title,
	description,
	price,
	imageUrl,
	category,
	productId,
	seller,
}) => {
	return (
		<Card className="w-full max-w-[18rem] p-0 gap-0 pb-4 relative group">
			<div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<FavoriteButton productId={productId} size="sm" />
			</div>
			<Link
				href={`/products/${category}/${productId}`}
				className="no-underline"
			>
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
					{seller && (
						<div className="mt-2 pt-2 border-t border-gray-100">
							<SellerLink
								userId={seller.id}
								username={seller.username}
								name={seller.name}
							/>
						</div>
					)}
				</CardContent>
			</Link>
		</Card>
	);
};

export default ProductCardWithSeller;
