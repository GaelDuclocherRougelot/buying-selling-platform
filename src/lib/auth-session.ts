import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * getUser function retrieves the current user's session information.
 * It uses the BetterAuth API to get the session headers and returns the user object.
 *
 * @returns {Promise<Session["user"] | null>} A Promise that resolves to the user object or null if not authenticated.
 */
export async function getUser() {
	"use server";
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	return session?.user || null;
}
