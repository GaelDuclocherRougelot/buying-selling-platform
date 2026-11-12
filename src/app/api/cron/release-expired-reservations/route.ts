import { releaseExpiredReservations } from "@/services/reservation";
import { NextRequest, NextResponse } from "next/server";

/**
 * Cron Vercel (GET, voir vercel.json) : repasse en "active" les produits
 * réservés dont l'offre acceptée n'a pas été payée dans le délai.
 * Protégé par CRON_SECRET (envoyé par Vercel en Authorization: Bearer).
 */
export async function GET(request: NextRequest) {
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret) {
		return NextResponse.json(
			{ error: "Cron secret not configured" },
			{ status: 500 }
		);
	}

	if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const released = await releaseExpiredReservations();
		return NextResponse.json({ success: true, released });
	} catch (error) {
		console.error("Failed to release expired reservations:", error);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
