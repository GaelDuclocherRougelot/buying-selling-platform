import { addCorsHeaders, handleCors } from "@/lib/cors";
import { getLastTenProducts } from "@/services/product";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     description: Get the last 10 featured products
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Products'
 *       500:
 *         description: Internal Server Error
 */
export async function GET(request: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const products = await getLastTenProducts();
		const response = NextResponse.json(products);
		return addCorsHeaders(response);
	} catch {
		const response = NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
		return addCorsHeaders(response);
	}
}
