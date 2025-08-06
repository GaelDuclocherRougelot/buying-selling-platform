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

interface Product {
	id: string;
	title: string;
	description: string | null;
	price: number;
	condition: string;
	imagesUrl: string[];
	delivery: string;
	deliveryPrice: number | null;
	city: string | null;
	createdAt: string;
	category: {
		id: string;
		name: string;
		displayName: string;
	};
	owner: {
		id: string;
		name: string;
		username: string | null;
		displayUsername: string | null;
	};
}

interface SearchProductCardProps {
	product: Product;
}

/**
 * SearchProductCard component displays a card with product details for search results.
 * It includes an image, title, description, price, seller link, and links to the product page.
 *
 * @param {SearchProductCardProps} props - Component properties
 * @returns {JSX.Element} The SearchProductCard component
 */
const SearchProductCard: React.FC<SearchProductCardProps> = ({ product }) => {
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("fr-FR", {
			style: "currency",
			currency: "EUR",
		}).format(price);
	};

	const getDisplayName = (owner: Product["owner"]) => {
		return owner.displayUsername || owner.username || owner.name;
	};

	const getConditionLabel = (condition: string) => {
		const conditions: Record<string, string> = {
			pristine: "Neuf",
			good: "Bon état",
			mid: "État moyen",
			damaged: "Mauvais état",
		};
		return conditions[condition] || condition;
	};

	return (
		<Card className="w-full p-0 gap-0 pb-4 relative group hover:shadow-lg transition-shadow duration-200">
			<div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<FavoriteButton productId={product.id} size="sm" />
			</div>
			<Link
				href={`/products/${product.category.name}/${product.id}`}
				className="no-underline"
			>
				<CardHeader className="p-0 h-48">
					<Image
						src={
							product.imagesUrl[0] ||
							"/images/product_default.webp"
						}
						alt={product.title}
						width={300}
						height={300}
						className="w-full h-48 object-cover rounded-t-md"
					/>
				</CardHeader>
				<CardContent className="border-t pt-4 px-4">
					<div className="flex items-start justify-between mb-2">
						<CardTitle className="text-lg font-bold line-clamp-2">
							{product.title}
						</CardTitle>
						<span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
							{getConditionLabel(product.condition)}
						</span>
					</div>

					{product.description && (
						<CardDescription className="line-clamp-2 mb-3">
							{product.description}
						</CardDescription>
					)}

					<div className="flex items-center justify-between mb-2">
						<p className="text-xl font-bold text-blue-600">
							{formatPrice(product.price)}
						</p>
						{product.city && (
							<span className="text-sm text-gray-500">
								📍 {product.city}
							</span>
						)}
					</div>

					{product.deliveryPrice && product.deliveryPrice > 0 && (
						<p className="text-sm text-gray-600 mb-2">
							Livraison: {formatPrice(product.deliveryPrice)}
						</p>
					)}
				</CardContent>
			</Link>

			{/* SellerLink en dehors du Link principal pour éviter les liens imbriqués */}
			<div className="px-4 pb-2">
				<SellerLink
					userId={product.owner.id}
					username={product.owner.username}
					name={getDisplayName(product.owner)}
				/>
			</div>
		</Card>
	);
};

export default SearchProductCard;
