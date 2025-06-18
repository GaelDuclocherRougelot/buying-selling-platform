import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
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
	account: {
		accountLinking: {
			enabled: true,
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		async sendResetPassword(data) {
			await resend.emails.send({
				from: "gaelduclocher.rougelot@gmail.com",
				to: data.user.email,
				subject: "Réinitialiser votre mot de passe",
				text: `Réinitialiser votre mot de passe en cliquant sur ce lien : ${data.url}`,
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
	plugins: [
		nextCookies(),
		username({
			minUsernameLength: 5,
			maxUsernameLength: 20,
			usernameValidator: (username) => {
				return /^[a-zA-Z0-9_]+$/.test(username); // Only allow alphanumeric characters and underscores
			},
		}),
	],
});
