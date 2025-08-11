import {
	inferAdditionalFields,
	usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

/**
 * Auth client configuration for the application.
 * This client is used to manage user authentication and session handling.
 * It includes plugins for username validation and is configured with the base URL of the application.
 */
export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	plugins: [usernameClient(), inferAdditionalFields<typeof auth>()],
});

/**
 * Exported functions for user authentication.
 * These functions allow users to sign in, sign out, and sign up.
 * They also provide a hook to access the current session.
 */
export const { signIn, signOut, signUp, useSession } = authClient;
