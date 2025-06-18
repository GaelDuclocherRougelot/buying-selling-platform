import { getAllProducts } from "@/services/product";
import { NextResponse } from "next/server";

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
export async function GET() {
	try {
		const products = await getAllProducts();
		return NextResponse.json(products);
	} catch {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
