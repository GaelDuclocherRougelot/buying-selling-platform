import { deleteMultipleImagesFromCloudinary } from "@/lib/cloudinary-utils";
import { prisma } from "@/lib/prisma";
import { getProductWithOwnerById } from "@/services/product";
import { NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for product updates
const updateProductSchema = z.object({
	title: z.string().min(1, "Title is required").optional(),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be non-negative").optional(),
	condition: z.string().min(1, "Condition is required").optional(),
	imagesUrl: z
		.array(z.string().url("Each image must be a valid URL"))
		.optional(),
	categoryId: z.string().min(1, "Category ID is required").optional(),
	delivery: z.string().min(1, "Delivery is required").optional(),
	city: z.string().optional(),
	deliveryPrice: z.number().default(0).optional(),
	status: z
		.enum(["active", "inactive", "pending", "sold", "rejected"])
		.optional(),
});

/**
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     description: Get a product by ID
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 *
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const productId = url.pathname.split("/").pop() as string;
		const product = await getProductWithOwnerById(productId);
		if (!product) {
			return NextResponse.json(
				{ error: "Product not found" },
				{ status: 404 }
			);
		}
		return NextResponse.json(product);
	} catch {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/products/{productId}:
 *   put:
 *     description: Update a product by ID
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdate'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */
export async function PUT(request: Request) {
	try {
		const url = new URL(request.url);
		const productId = url.pathname.split("/").pop() as string;
		const body = await request.json();

		// Validate the request body
		const parseResult = updateProductSchema.safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parseResult.error.flatten(),
				},
				{ status: 400 }
			);
		}

		// Check if product exists
		const existingProduct = await prisma.product.findUnique({
			where: { id: productId },
		});

		if (!existingProduct) {
			return NextResponse.json(
				{ error: "Product not found" },
				{ status: 404 }
			);
		}

		// If imagesUrl is being updated, delete removed images from Cloudinary
		if (parseResult.data.imagesUrl && existingProduct.imagesUrl) {
			const removedImages = existingProduct.imagesUrl.filter(
				(url) => !parseResult.data.imagesUrl!.includes(url)
			);

			if (removedImages.length > 0) {
				const deleteResult =
					await deleteMultipleImagesFromCloudinary(removedImages);
				console.log(
					`Images supprimées de Cloudinary lors de la mise à jour: ${deleteResult.success} réussies, ${deleteResult.failed} échouées`
				);
			}
		}

		// If categoryId is being updated, check if the category exists
		if (parseResult.data.categoryId) {
			const category = await prisma.category.findUnique({
				where: { id: parseResult.data.categoryId },
			});

			if (!category) {
				return NextResponse.json(
					{ error: "Category not found" },
					{ status: 404 }
				);
			}
		}

		// Update the product
		const updatedProduct = await prisma.product.update({
			where: { id: productId },
			data: parseResult.data,
		});

		return NextResponse.json(updatedProduct);
	} catch (error) {
		console.error("Error updating product:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/products/{productId}:
 *   delete:
 *     description: Delete a product by ID
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal Server Error
 */
export async function DELETE(request: Request) {
	try {
		const url = new URL(request.url);
		const productId = url.pathname.split("/").pop() as string;

		// Check if product exists
		const existingProduct = await prisma.product.findUnique({
			where: { id: productId },
		});

		if (!existingProduct) {
			return NextResponse.json(
				{ error: "Product not found" },
				{ status: 404 }
			);
		}

		// Delete images from Cloudinary if they exist
		if (existingProduct.imagesUrl && existingProduct.imagesUrl.length > 0) {
			const deleteResult = await deleteMultipleImagesFromCloudinary(
				existingProduct.imagesUrl
			);
			console.log(
				`Images supprimées de Cloudinary: ${deleteResult.success} réussies, ${deleteResult.failed} échouées`
			);
		}

		// Delete the product
		await prisma.product.delete({
			where: { id: productId },
		});

		return NextResponse.json(
			{ message: "Product deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error deleting product:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
