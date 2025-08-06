import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Category } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";

/**
 * CategoryCard component displays a card with category details.
 * It includes an image and title for the category.
 *
 * @param {Category} props - Component properties
 * @returns {JSX.Element} The CategoryCard component
 */
const CategoryCard: React.FC<Category> = ({
	displayName,
	imageUrl,
}: Category): JSX.Element => {
	return (
		<Link href={`/categories/${displayName}`} className="no-underline">
			<Card className="w-full max-w-[18rem] p-0 gap-0 pb-4 cursor-pointer hover:shadow-lg transition-shadow duration-200">
				<CardHeader className="p-0 h-72">
					<Image
						src={imageUrl || "/images/product_default.webp"}
						alt={displayName}
						width={300}
						height={300}
						className="w-full h-72 object-cover rounded-t-md"
					/>
				</CardHeader>
				<CardContent className="border-t pt-4">
					<CardTitle className="text-2xl font-bold">
						{displayName}
					</CardTitle>
				</CardContent>
			</Card>
		</Link>
	);
};

export default CategoryCard;
