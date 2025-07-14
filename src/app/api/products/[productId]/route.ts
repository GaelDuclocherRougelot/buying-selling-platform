import { getProductWithOwnerById } from "@/services/product";
import { NextResponse } from "next/server";

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
