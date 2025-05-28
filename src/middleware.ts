import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);

	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/", request.url));
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
