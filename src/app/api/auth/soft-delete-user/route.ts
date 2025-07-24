// app/api/delete-user/route.ts
import { getUser } from "@/lib/auth-session";
import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { deleteUserAccount } from "@/services/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(req);
	if (corsPreflightResponse) return corsPreflightResponse;

	const user = await getUser();

	if (!user) {
		return corsResponse({ error: "Unauthorized" }, 401);
	}

	const { userId } = await req.json();

	// Par sécurité, tu peux vérifier que l'userId correspond à session.user.id
	if (user.id !== userId) {
		return corsResponse({ error: "Forbidden" }, 403);
	}

	await deleteUserAccount(userId);

	const response = NextResponse.json({ success: true });
	return addCorsHeaders(response);
}
