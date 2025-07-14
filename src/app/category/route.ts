import { getAllCategories } from "@/services/category";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const categories = await getAllCategories();
		return NextResponse.json(categories);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch categories" },
			{ status: 500 }
		);
	}
}
