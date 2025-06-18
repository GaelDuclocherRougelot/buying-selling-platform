import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import React from "react";

interface CategoryCardProps {
	title: string;
	imageUrl: string;
}

/**
 * CategoryCard component displays a card with category details.
 * It includes an image and title for the category.
 *
 * @param {CategoryCardProps} props - Component properties
 * @returns {JSX.Element} The CategoryCard component
 */
const CategoryCard: React.FC<CategoryCardProps> = ({ title, imageUrl }) => {
	return (
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
				<CardTitle className="text-2xl font-bold">{title}</CardTitle>
			</CardContent>
		</Card>
	);
};

export default CategoryCard;
