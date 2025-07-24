import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { getAdminStats } from "@/services/special";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const stats = await getAdminStats();
		const response = NextResponse.json(stats, { status: 200 });
		return addCorsHeaders(response);
	} catch (error) {
		console.error("Error fetching admin stats:", error);
		return corsResponse({ error: "Failed to fetch admin stats" }, 500);
	}
}
