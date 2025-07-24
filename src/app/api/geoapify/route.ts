import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(req);
	if (corsPreflightResponse) return corsPreflightResponse;

	const { searchParams } = new URL(req.url);
	const text = searchParams.get("text");

	if (!text) {
		return corsResponse({ error: "Missing 'text' query parameter" }, 400);
	}

	const apiKey = process.env.GEOAPIFY_API_KEY;
	if (!apiKey) {
		return corsResponse({ error: "Geoapify API key not configured" }, 500);
	}

	const geoapifyUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
		text
	)}&apiKey=${apiKey}&lang=fr`;

	try {
		const geoapifyRes = await fetch(geoapifyUrl);
		if (!geoapifyRes.ok) {
			return corsResponse(
				{ error: "Geoapify API error" },
				geoapifyRes.status
			);
		}
		const data = await geoapifyRes.json();
		const response = NextResponse.json(data);
		return addCorsHeaders(response);
	} catch {
		return corsResponse({ error: "Failed to fetch from Geoapify" }, 500);
	}
}
