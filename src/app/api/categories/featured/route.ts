import { getTopCategoriesByProductCount } from "@/services/category";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	// You can optionally get the limit from the query string, default to 10
	const { searchParams } = new URL(request.url);
	const limitParam = searchParams.get("limit");
	const limit = limitParam ? parseInt(limitParam, 10) : 10;

	const categories = await getTopCategoriesByProductCount(limit);
	return NextResponse.json(categories, { status: 200 });
}
