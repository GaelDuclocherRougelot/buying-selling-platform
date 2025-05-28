import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { resend } from "./resend";

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
		async sendResetPassword(data) {
			await resend.emails.send({
				from: "noreply@example.com",
				to: data.user.email,
				subject: "Reset Password",
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
	plugins: [nextCookies()],
});
