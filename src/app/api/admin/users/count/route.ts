import { auth } from "@/lib/auth";
import { getAllUsersCount } from "@/services/user";
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

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
	try {
		const authCheck = await checkAdminAccess(request);
		if ("error" in authCheck) {
			return NextResponse.json(
				{ error: authCheck.error },
				{ status: authCheck.status }
			);
		}

		const users = await getAllUsersCount();

		return NextResponse.json({
			users,
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
