import { auth } from "@/lib/auth";
import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { getAllVerifiedUsersCount } from "@/services/user";
import { NextRequest, NextResponse } from "next/server";

// Helper function to check admin access
async function checkAdminAccess(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		return { error: "Unauthorized", status: 401 };
	}

	if (session.user.role !== "admin") {
		return { error: "Forbidden: Admin access required", status: 403 };
	}

	return { user: session.user };
}

export async function GET(request: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const authCheck = await checkAdminAccess(request);
		if ("error" in authCheck) {
			return corsResponse({ error: authCheck.error }, authCheck.status);
		}

		const users = await getAllVerifiedUsersCount();
		console.log(users);
		const response = NextResponse.json({
			users,
		});
		return addCorsHeaders(response);
	} catch (error) {
		console.error("Error fetching users:", error);
		return corsResponse({ error: "Internal server error" }, 500);
	}
}
