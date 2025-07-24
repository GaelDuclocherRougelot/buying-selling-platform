import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
