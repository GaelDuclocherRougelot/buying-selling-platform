// app/api/city-boundary/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const city = req.nextUrl.searchParams.get("city");

	if (!city) {
		return NextResponse.json(
			{ error: "Missing city name" },
			{ status: 400 }
		);
	}

	const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];relation["name"="${city}"]["admin_level"="8"]["type"="boundary"];out geom;`;

	const res = await fetch(overpassUrl);

	if (!res.ok) {
		return NextResponse.json(
			{ error: "Failed to fetch boundary" },
			{ status: 500 }
		);
	}

	const data = await res.json();
	if (!data.elements || data.elements.length === 0) {
		return NextResponse.json(
			{ error: "No boundary found" },
			{ status: 404 }
		);
	}

	const geometry = data.elements[0].geometry; // tableau de {lat, lon}
	return NextResponse.json({ geometry });
}
