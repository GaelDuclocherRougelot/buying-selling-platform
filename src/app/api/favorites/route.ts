import { auth } from "@/lib/auth";
import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { addToFavorites, getUserFavorites } from "@/services/favorites";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user favorites
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user favorites
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *   post:
 *     summary: Add a product to favorites
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product added to favorites
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
export async function GET(request: NextRequest) {
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

		const favorites = await getUserFavorites(session.user.id);
		return addCorsHeaders(NextResponse.json(favorites, { status: 200 }));
	} catch (error) {
		console.error("Error fetching favorites:", error);
		return corsResponse({ error: "Internal Server Error" }, 500);
	}
}

export async function POST(request: NextRequest) {
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

		const body = await request.json();
		const { productId } = body;

		if (!productId) {
			return corsResponse({ error: "Product ID is required" }, 400);
		}

		const favorite = await addToFavorites(session.user.id, productId);
		return addCorsHeaders(NextResponse.json(favorite, { status: 201 }));
	} catch (error) {
		console.error("Error adding favorite:", error);

		if (error instanceof Error) {
			if (error.message === "Product not found") {
				return corsResponse({ error: "Product not found" }, 404);
			}
			if (error.message === "Product already in favorites") {
				return corsResponse(
					{ error: "Product already in favorites" },
					400
				);
			}
		}

		return corsResponse({ error: "Internal Server Error" }, 500);
	}
}
