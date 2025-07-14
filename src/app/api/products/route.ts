import { prisma } from "@/lib/prisma";
import { getAllProducts } from "@/services/product";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Zod schema for product creation
const createProductSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be non-negative"),
	condition: z.string().min(1, "Condition is required"),
	imagesUrl: z.array(z.string().url("Each image must be a valid URL")),
	categoryId: z.string().min(1, "Category ID is required"),
	ownerId: z.string().min(1, "Owner ID is required"),
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     description: Get all products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema: 
 *               $ref: '#/components/schemas/Products'
 *       400:
 *         description: Bad Request
 *       404:
 *         description: No products found
 *       500:
 *         description: Internal Server Error
 *
 */
export async function GET() {
	try {
		const products = await getAllProducts();
		return NextResponse.json(products);
	} catch {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     description: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal Server Error
 */
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

		const { title, description, price, condition, imagesUrl, categoryId, ownerId } =
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
				ownerId,
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
