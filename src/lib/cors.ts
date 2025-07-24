import { NextRequest, NextResponse } from "next/server";

/**
 * CORS configuration for API routes
 */
export const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, X-Requested-With",
	"Access-Control-Max-Age": "86400",
};

/**
 * Handle CORS preflight requests
 */
export function handleCors(request: NextRequest) {
	// Handle preflight requests
	if (request.method === "OPTIONS") {
		return new NextResponse(null, {
			status: 200,
			headers: corsHeaders,
		});
	}
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: NextResponse) {
	Object.entries(corsHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});
	return response;
}

/**
 * Create a CORS-enabled response
 */
export function corsResponse(data: unknown, status: number = 200) {
	const response = NextResponse.json(data, { status });
	return addCorsHeaders(response);
}
