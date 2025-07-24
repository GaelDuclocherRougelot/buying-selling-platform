import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { getUserByUsername } from "@/services/user";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(req);
	if (corsPreflightResponse) return corsPreflightResponse;

	const username = req.nextUrl.searchParams.get("username");

	if (!username) {
		return corsResponse({ error: "Aucun nom d'utilisateur fourni" }, 400);
	}

	try {
		const user = await getUserByUsername(username);
		if (!user) {
			const response = NextResponse.json(
				{ avalaible: true },
				{
					status: 200,
				}
			);
			return addCorsHeaders(response);
		}
		const response = NextResponse.json(
			{ available: false },
			{
				status: 200,
			}
		);
		return addCorsHeaders(response);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return corsResponse({ error: error.errors }, 400);
		}
		return corsResponse({ error: "Erreur interne" }, 500);
	}
}
