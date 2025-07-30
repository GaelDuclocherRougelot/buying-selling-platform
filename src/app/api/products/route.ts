import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { getAllProducts } from "@/services/product";
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
	ownerId: z.string().min(1, "Owner ID is required"),
	delivery: z.string().min(1, "Delivery is required"),
	city: z.string().optional(),
	deliveryPrice: z.number().default(0),
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
export async function GET(request: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const { searchParams } = new URL(request.url);
		const category = searchParams.get("category");

		let products;
		if (category) {
			// Filtrer par catégorie
			products = await prisma.product.findMany({
				where: {
					category: {
						name: category,
					},
					status: "active", // Seulement les produits actifs
				},
				include: {
					category: true,
					owner: {
						select: {
							id: true,
							name: true,
							username: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			});
		} else {
			// Tous les produits
			products = await getAllProducts();
		}

		const response = NextResponse.json(products);
		return addCorsHeaders(response);
	} catch (error) {
		console.error("Error fetching products:", error);
		const response = NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
		return addCorsHeaders(response);
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
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const body = await request.json();

		const parseResult = createProductSchema.safeParse(body);
		if (!parseResult.success) {
			return corsResponse(
				{
					error: "Validation failed",
					details: parseResult.error.flatten(),
				},
				400
			);
		}

		const {
			title,
			description,
			price,
			condition,
			imagesUrl,
			categoryId,
			ownerId,
			delivery,
			city,
			deliveryPrice,
		} = parseResult.data;

		// Check if category exists
		const category = await prisma.category.findUnique({
			where: { id: categoryId },
		});

		if (!category) {
			return corsResponse({ error: "Category not found" }, 404);
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
				delivery,
				city,
				deliveryPrice,
			},
		});

		const response = NextResponse.json(product, { status: 201 });
		return addCorsHeaders(response);
	} catch (error) {
		console.error("Error creating product:", error);
		return corsResponse({ error: "Internal Server Error" }, 500);
	}
}
