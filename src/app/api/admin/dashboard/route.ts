import { NextResponse } from "next/server";
import { getAdminStats } from "@/services/special";

export async function GET() {
	try {
		const stats = await getAdminStats();
		return NextResponse.json(stats, { status: 200 });
	} catch (error) {
		console.error("Error fetching admin stats:", error);
		return NextResponse.json(
			{ error: "Failed to fetch admin stats" },
			{ status: 500 }
		);
	}
}
