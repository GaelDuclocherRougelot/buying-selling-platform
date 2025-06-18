import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware function to protect routes that require authentication.
 * It checks for a session cookie and redirects to the login page if not found.
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {NextResponse} The response object, either redirecting to login or continuing the request
 */
export async function middleware(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);

	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}

	return NextResponse.next();
}

// Routes protégées par le middleware
export const config = {
	matcher: [
		"/auth/profile",
		"/auth/favorites",
		"/auth/messages",
		"/auth/publish",
		"/auth/profile/edit",
	],
};
