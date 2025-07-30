import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/products/user/{userId}:
 *   get:
 *     summary: Get products by user ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose products to fetch
 *     responses:
 *       200:
 *         description: List of products for the user
 *       404:
 *         description: User not found or no products
 *       500:
 *         description: Internal Server Error
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const { userId } = await params;

		if (!userId) {
			return corsResponse({ error: "Missing userId" }, 400);
		}

		const products = await prisma.product.findMany({
			where: { ownerId: userId },
			orderBy: { createdAt: "desc" },
			include: {
				category: true,
			},
		});

		return addCorsHeaders(NextResponse.json(products, { status: 200 }));
	} catch (error) {
		console.error("Error fetching products by user:", error);
		return corsResponse({ error: "Internal Server Error" }, 500);
	}
}
