import { prisma } from "@/lib/prisma";
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
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "8");
		const skip = (page - 1) * limit;

		// Get total count
		const totalProducts = await prisma.product.count();

		// Get products with pagination
		const products = await prisma.product.findMany({
			skip,
			take: limit,
			include: {
				category: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Calculate pagination info
		const totalPages = Math.ceil(totalProducts / limit);
		const hasNextPage = page < totalPages;
		const hasPreviousPage = page > 1;

		return NextResponse.json({
			products,
			pagination: {
				currentPage: page,
				totalPages,
				totalProducts,
				productsPerPage: limit,
				hasNextPage,
				hasPreviousPage,
			},
		});
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
