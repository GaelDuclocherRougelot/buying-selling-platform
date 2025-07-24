import { deleteExpiredUsers, getSoftDeletedUsersStats } from "@/services/cron";
import { NextRequest, NextResponse } from "next/server";

/**
 * API route for deleting expired users
 * This can be called by external cron services like Vercel Cron
 *
 * Environment variables needed:
 * - CRON_SECRET: A secret key to secure the endpoint
 *
 * Usage with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/delete-expired-users",
 *       "schedule": "0 2 * * *"
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
	try {
		// Verify the request is authorized
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (!cronSecret) {
			console.error("CRON_SECRET environment variable is not set");
			return NextResponse.json(
				{ error: "Cron secret not configured" },
				{ status: 500 }
			);
		}

		if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		console.log("Starting expired users cleanup via API...");
		console.log("Timestamp:", new Date().toISOString());

		// Get stats before deletion
		const stats = await getSoftDeletedUsersStats();
		console.log("Current stats:", stats);

		// Delete expired users
		const result = await deleteExpiredUsers();
		console.log("Cleanup result:", result);

		// Get stats after deletion
		const statsAfter = await getSoftDeletedUsersStats();
		console.log("Stats after cleanup:", statsAfter);

		return NextResponse.json({
			success: true,
			message: "Expired users cleanup completed successfully",
			result,
			stats: {
				before: stats,
				after: statsAfter,
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to cleanup expired users:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}

/**
 * GET endpoint for checking the status and getting stats
 */
export async function GET(request: NextRequest) {
	try {
		// Verify the request is authorized
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (!cronSecret) {
			return NextResponse.json(
				{ error: "Cron secret not configured" },
				{ status: 500 }
			);
		}

		if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const stats = await getSoftDeletedUsersStats();

		return NextResponse.json({
			success: true,
			stats,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to get stats:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
