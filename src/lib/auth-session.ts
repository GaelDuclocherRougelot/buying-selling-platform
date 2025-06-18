import { User } from "better-auth";
import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * getUser function retrieves the current user's session information.
 * It uses the BetterAuth API to get the session headers and returns the user object.
 *
 * @returns {Promise<User | null>} A Promise that resolves to the user object or null if not authenticated.
 */
export async function getUser(): Promise<User | null> {
	"use server";
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	return session?.user ?? null;
}
