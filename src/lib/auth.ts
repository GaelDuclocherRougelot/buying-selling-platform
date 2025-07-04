import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { openAPI, username } from "better-auth/plugins";
import { Pool } from "pg";
import { resend } from "./resend";

/**
 * Authentication configuration for the application.
 * This configuration uses BetterAuth for user management and authentication.
 * It includes email and password authentication, social login with Google,
 * and username validation.
 */
export const auth = betterAuth({
	database: new Pool({
		connectionString: process.env.CONNECTION_STRING,
	}),
	emailAndPassword: {
		enabled: true,
		async sendResetPassword(data) {
			await resend.emails.send({
				from: "ZONE <noreply@noreply.gael-dr.fr>",
				to: [data.user.email],
				subject: "Réinitialiser votre mot de passe",
				text: `Réinitialiser votre mot de passe en cliquant sur ce lien : ${data.url}`,
			});
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		sendVerificationEmail: async ({ user, url }) => {
			await resend.emails.send({
				from: "ZONE <noreply@noreply.gael-dr.fr>",
				to: [user.email],
				subject: "Vérifiez votre adresse email",
				text: `Merci de vérifier votre adresse email en cliquant sur ce lien : ${url}`,
			});
		},
	},
	socialProviders: {
		google: {
			prompt: "select_account",
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
	},
	user: {
		additionalFields: {
			username: {
				type: "string",
				unique: false,
			},
			role: {
				type: "string",
				default: "user", // Default role for new users
			},
			deletedAt: {
				type: "date",
				default: null, // Field to mark user deletion
				required: false,
			},
		},
		deleteUser: {
			enabled: true,
		},
	},
	rateLimit: {
		enabled: true,
		window: 10,
		max: 100,
		customRules: {
			"/auth/register": {
				window: 10,
				max: 100,
			},
			"/auth/login": {
				window: 10,
				max: 100,
			},
			"/auth/reset-password": {
				window: 10,
				max: 100,
			},
			"/auth/verify-email": {
				window: 10,
				max: 100,
			},
		},
		storage: "memory",
		modelName: "rateLimit",
	},
	plugins: [
		nextCookies(),
		openAPI(),
		username({
			minUsernameLength: 5,
			maxUsernameLength: 20,
			usernameValidator: (username) => {
				if (username === "admin") {
					return false; // Prevent using 'admin' as a username
				}
				return /^[a-zA-Z0-9_]+$/.test(username); // Only allow alphanumeric characters and underscores
			},
		}),
	],
});
