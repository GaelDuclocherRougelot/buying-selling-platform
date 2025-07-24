import { prisma } from "@/lib/prisma";
import { getAllProductsForAdmin } from "@/services/product";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for product creation
const createProductSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be non-negative"),
	condition: z.string().min(1, "Condition is required"),
	imagesUrl: z.array(z.string().url("Each image must be a valid URL")),
	categoryId: z.string().min(1, "Category ID is required"),
});

// GET /api/admin/products - Get all products (including sold ones)
export async function GET() {
	try {
		const products = await getAllProductsForAdmin();
		return NextResponse.json(products);
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// POST /api/admin/products - Create a new product
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const parseResult = createProductSchema.safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parseResult.error.flatten(),
				},
				{ status: 400 }
			);
		}

		const { title, description, price, condition, imagesUrl, categoryId } =
			parseResult.data;

		// Check if category exists
		const category = await prisma.category.findUnique({
			where: { id: categoryId },
		});
		if (!category) {
			return NextResponse.json(
				{ error: "Category not found" },
				{ status: 404 }
			);
		}

		const product = await prisma.product.create({
			data: {
				title,
				description,
				price,
				condition,
				imagesUrl,
				categoryId,
				ownerId: "default-user-id", // Add default owner ID for admin-created products
			},
		});

		return NextResponse.json(product, { status: 201 });
	} catch (error) {
		console.error("Error creating product:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
