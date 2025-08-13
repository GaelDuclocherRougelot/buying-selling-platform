import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

/**
 * CORS configuration
 */
const corsHeaders = {
	"Access-Control-Allow-Origin": "*", // Ou spécifiez vos domaines autorisés
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
	"Access-Control-Allow-Headers":
		"Content-Type, Authorization, X-Requested-With, Accept",
	"Access-Control-Max-Age": "86400",
	"Access-Control-Allow-Credentials": "true",
};

/**
 * Middleware function to handle CORS globally and protect routes that require authentication.
 */
export async function middleware(request: NextRequest) {
	// Gestion globale du CORS
	if (request.method === "OPTIONS") {
		return new NextResponse(null, {
			status: 200,
			headers: corsHeaders,
		});
	}

	// Ajouter les en-têtes CORS à toutes les réponses
	const response = NextResponse.next();
	Object.entries(corsHeaders).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	// Gestion de l'authentification pour les routes protégées
	const sessionCookie = getSessionCookie(request);

	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}

	// For admin routes, check if user has admin role
	if (request.nextUrl.pathname.startsWith("/admin")) {
		// Note: Role checking is done at the page level for now
		// since we need to access the session data which requires server-side rendering
		return NextResponse.next();
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
		"/admin/:path*",
	],
};
