import { handleApiRoute } from "@/lib/api-error-handler";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		const text = searchParams.get("text");

		if (!text) {
			throw new Error("text parameter is required");
		}

		const apiKey = process.env.GEOAPIFY_API_KEY;
		if (!apiKey) {
			throw new Error("GEOAPIFY_API_KEY not configured");
		}

		const response = await fetch(
			`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&filter=countrycode:fr&limit=10&apiKey=${apiKey}`
		);

		if (!response.ok) {
			throw new Error(`Geoapify API error: ${response.status}`);
		}

		const data = await response.json();
		return data;
	});
}
