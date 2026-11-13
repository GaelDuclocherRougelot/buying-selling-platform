import { auth } from "@/lib/auth";
import {
	createAuthErrorResponse,
	createForbiddenErrorResponse,
} from "@/lib/api-error-handler";
import { securityLog } from "@/lib/security-log";
import { NextRequest, NextResponse } from "next/server";

type SessionUser = NonNullable<
	Awaited<ReturnType<typeof auth.api.getSession>>
>["user"];

/**
 * Le middleware exclut /api : chaque route vérifie elle-même la session.
 * Renvoie l'utilisateur, ou une réponse 401 à renvoyer telle quelle
 * (`if (user instanceof NextResponse) return user;`).
 */
export async function requireUser(
	request: NextRequest
): Promise<SessionUser | NextResponse> {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) {
		await securityLog("authz.unauthenticated", request.headers, {
			path: request.nextUrl.pathname,
			method: request.method,
		});
		return createAuthErrorResponse();
	}
	return session.user;
}

/** Comme requireUser, plus 403 si le rôle n'est pas "admin". */
export async function requireAdmin(
	request: NextRequest
): Promise<SessionUser | NextResponse> {
	const user = await requireUser(request);
	if (user instanceof NextResponse) return user;
	if (user.role !== "admin") {
		await securityLog("authz.denied", request.headers, {
			path: request.nextUrl.pathname,
			method: request.method,
			userId: user.id,
			role: user.role,
		});
		return createForbiddenErrorResponse();
	}
	return user;
}
