import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Helper function to check admin access
async function checkAdminAccess(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		return { error: "Unauthorized", status: 401 };
	}

	if (session.user.role !== "admin") {
		return { error: "Forbidden: Admin access required", status: 403 };
	}

	return { user: session.user };
}

// Zod schema for category update
const updateCategorySchema = z.object({
	displayName: z.string().min(1, "Display name is required"),
	name: z
		.string()
		.min(1, "Name is required")
		.regex(
			/^[a-z0-9-]+$/,
			"Name must contain only lowercase letters, numbers, and hyphens"
		),
	imageUrl: z.string().optional(),
});

// PUT /api/admin/categories/[categoryId] - Update a category
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ categoryId: string }> }
) {
	try {
		const authCheck = await checkAdminAccess(request);
		if ("error" in authCheck) {
			return NextResponse.json(
				{ error: authCheck.error },
				{ status: authCheck.status }
			);
		}

		const { categoryId } = await params;
		const body = await request.json();

		const parseResult = updateCategorySchema.safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parseResult.error.flatten(),
				},
				{ status: 400 }
			);
		}

		const { displayName, name, imageUrl } = parseResult.data;

		// Check if category exists
		const existingCategory = await prisma.category.findUnique({
			where: { id: categoryId },
		});

		if (!existingCategory) {
			return NextResponse.json(
				{ error: "Category not found" },
				{ status: 404 }
			);
		}

		// Check if name is already taken by another category
		const nameExists = await prisma.category.findFirst({
			where: {
				name,
				id: { not: categoryId },
			},
		});

		if (nameExists) {
			return NextResponse.json(
				{ error: "Category name already exists" },
				{ status: 409 }
			);
		}

		// Update the category
		const updatedCategory = await prisma.category.update({
			where: { id: categoryId },
			data: {
				displayName,
				name,
				imageUrl,
			},
		});

		return NextResponse.json(updatedCategory, { status: 200 });
	} catch (error) {
		console.error("Error updating category:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// DELETE /api/admin/categories/[categoryId] - Delete a category
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ categoryId: string }> }
) {
	try {
		const authCheck = await checkAdminAccess(request);
		if ("error" in authCheck) {
			return NextResponse.json(
				{ error: authCheck.error },
				{ status: authCheck.status }
			);
		}

		const { categoryId } = await params;

		// Check if category exists
		const existingCategory = await prisma.category.findUnique({
			where: { id: categoryId },
		});

		if (!existingCategory) {
			return NextResponse.json(
				{ error: "Category not found" },
				{ status: 404 }
			);
		}

		// Delete the category
		await prisma.category.delete({
			where: { id: categoryId },
		});

		return NextResponse.json(
			{ message: "Category deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error deleting category:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
