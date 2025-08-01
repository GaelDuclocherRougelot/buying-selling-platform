import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for product updates
const updateProductSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be non-negative"),
	condition: z.string().min(1, "Condition is required"),
	status: z.enum(["active", "pending", "sold"]),
	categoryId: z.string().min(1, "Category ID is required"),
	imagesUrl: z.array(z.string().url("Each image must be a valid URL")),
});

// Helper function to check admin/moderator access
async function checkAdminAccess(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		return { error: "Unauthorized", status: 401 };
	}

	if (session.user.role !== "admin" && session.user.role !== "moderator") {
		return {
			error: "Forbidden: Admin or moderator access required",
			status: 403,
		};
	}

	return { user: session.user };
}

// PUT /api/admin/products/[productId] - Update a product
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	try {
		const authCheck = await checkAdminAccess(request);
		if ("error" in authCheck) {
			return NextResponse.json(
				{ error: authCheck.error },
				{ status: authCheck.status }
			);
		}

		const { productId } = await params;
		const body = await request.json();

		// Validate request body
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

		const {
			title,
			description,
			price,
			condition,
			status,
			categoryId,
			imagesUrl,
		} = parseResult.data;

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

		// Update the product
		const updatedProduct = await prisma.product.update({
			where: { id: productId },
			data: {
				title,
				description,
				price,
				condition,
				status,
				categoryId,
				imagesUrl,
				updatedAt: new Date(),
			},
			include: {
				category: true,
			},
		});

		return NextResponse.json(updatedProduct, { status: 200 });
	} catch (error) {
		console.error("Error updating product:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// DELETE /api/admin/products/[productId] - Delete a product
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	try {
		const authCheck = await checkAdminAccess(request);
		if ("error" in authCheck) {
			return NextResponse.json(
				{ error: authCheck.error },
				{ status: authCheck.status }
			);
		}

		const { productId } = await params;

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
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
