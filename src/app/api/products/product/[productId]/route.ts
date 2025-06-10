import { getProductById } from "@/services/product";
import { NextResponse } from "next/server";
import { z } from "zod";
const productIdSchema = z.object({
	productId: z.coerce.number().int().positive(),
});
export async function GET(
	request: Request,
	{ params }: { params: { productId: string } }
) {
	try {
		const { productId } = productIdSchema.parse({
			productId: params.productId,
		});
		const product = await getProductById(productId);
		if (!product) {
			return NextResponse.json(
				{ error: "Product not found" },
				{ status: 404 }
			);
		}
		return NextResponse.json(product);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
