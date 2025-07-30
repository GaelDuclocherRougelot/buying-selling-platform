import { auth } from "@/lib/auth";
import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { removeFromFavorites } from "@/services/favorites";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/favorites/{productId}:
 *   delete:
 *     summary: Remove a product from favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product to remove from favorites
 *     responses:
 *       200:
 *         description: Product removed from favorites
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favorite not found
 *       500:
 *         description: Internal Server Error
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return corsResponse({ error: "Unauthorized" }, 401);
		}

		const { productId } = await params;

		if (!productId) {
			return corsResponse({ error: "Product ID is required" }, 400);
		}

		await removeFromFavorites(session.user.id, productId);
		return addCorsHeaders(
			NextResponse.json({ message: "Favorite removed" }, { status: 200 })
		);
	} catch (error) {
		console.error("Error removing favorite:", error);

		if (error instanceof Error) {
			if (error.message === "Favorite not found") {
				return corsResponse({ error: "Favorite not found" }, 404);
			}
		}

		return corsResponse({ error: "Internal Server Error" }, 500);
	}
}
