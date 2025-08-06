import { addCorsHeaders, handleCors } from "@/lib/cors";
import { getTopCategoriesByProductCount } from "@/services/category";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	// You can optionally get the limit from the query string, default to 10
	const { searchParams } = new URL(request.url);
	const limitParam = searchParams.get("limit");
	const limit = limitParam ? parseInt(limitParam, 10) : 10;

	const categories = await getTopCategoriesByProductCount(limit);
	const response = NextResponse.json(categories, { status: 200 });

	return addCorsHeaders(response);
}
