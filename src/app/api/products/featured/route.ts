import { getLastTenProducts } from "@/services/product";
import { NextResponse } from "next/server";


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
export async function GET() {
    try {
        const products = await getLastTenProducts();
        return NextResponse.json(products);
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
