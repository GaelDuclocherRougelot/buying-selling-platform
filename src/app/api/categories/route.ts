import { addCorsHeaders, handleCors } from "@/lib/cors";
import { getAllCategories } from "@/services/category";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	const categories = await getAllCategories();
	const response = NextResponse.json(categories, { status: 200 });
	return addCorsHeaders(response);
}
