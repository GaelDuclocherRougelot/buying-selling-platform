import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategory } from "@/services/category";
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

// GET /api/admin/categories - Get all categories with pagination
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "8");
		const skip = (page - 1) * limit;

		// Get total count
		const totalCategories = await prisma.category.count();

		// Get categories with pagination
		const categories = await prisma.category.findMany({
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
		});

		// Calculate pagination info
		const totalPages = Math.ceil(totalCategories / limit);
		const hasNextPage = page < totalPages;
		const hasPreviousPage = page > 1;

		return NextResponse.json({
			categories,
			pagination: {
				currentPage: page,
				totalPages,
				totalCategories,
				categoriesPerPage: limit,
				hasNextPage,
				hasPreviousPage,
			},
		});
	} catch (error) {
		console.error("Error fetching categories:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     description: Creates a new category in the database. Only accessible by admin users.
 *     tags:
 *       - Admin - Categories
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - displayName
 *             properties:
 *               name:
 *                 type: string
 *                 description: The unique name/slug for the category
 *                 example: electronics
 *               displayName:
 *                 type: string
 *                 description: The display name for the category
 *                 example: Electronics
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: clx1234567890abcdef
 *                 name:
 *                   type: string
 *                   example: electronics
 *                 displayName:
 *                   type: string
 *                   example: Electronics
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden: Admin access required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

export async function POST(request: NextRequest) {
	try {
		const authCheck = await checkAdminAccess(request);
		if ("error" in authCheck) {
			return NextResponse.json(
				{ error: authCheck.error },
				{ status: authCheck.status }
			);
		}

		const { name, displayName, imageUrl } = await request.json();

		if (!name || !displayName) {
			return NextResponse.json(
				{ error: "Name and displayName are required" },
				{ status: 400 }
			);
		}

		const category = await createCategory(name, displayName, imageUrl);

		return NextResponse.json(category, { status: 201 });
	} catch (error) {
		console.error("Error creating category:", error);

		// Gérer les erreurs spécifiques
		if (error instanceof Error) {
			if (error.message.includes("existe déjà")) {
				return NextResponse.json(
					{ error: error.message },
					{ status: 409 }
				);
			}
			if (error.message.includes("doit contenir uniquement")) {
				return NextResponse.json(
					{ error: error.message },
					{ status: 400 }
				);
			}
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
