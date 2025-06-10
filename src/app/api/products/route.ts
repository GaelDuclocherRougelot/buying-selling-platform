import { getAllProducts } from "@/services/product";
import { NextResponse } from "next/server";

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
