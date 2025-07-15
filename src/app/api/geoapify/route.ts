import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const text = searchParams.get("text");

	if (!text) {
		return NextResponse.json(
			{ error: "Missing 'text' query parameter" },
			{ status: 400 }
		);
	}

	const apiKey = process.env.GEOAPIFY_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{ error: "Geoapify API key not configured" },
			{ status: 500 }
		);
	}

	const geoapifyUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
		text
	)}&apiKey=${apiKey}&lang=fr`;

	try {
		const geoapifyRes = await fetch(geoapifyUrl);
		if (!geoapifyRes.ok) {
			return NextResponse.json(
				{ error: "Geoapify API error" },
				{ status: geoapifyRes.status }
			);
		}
		const data = await geoapifyRes.json();
		return NextResponse.json(data);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch from Geoapify" },
			{ status: 500 }
		);
	}
}
