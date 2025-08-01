"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { LoginLogger } from "@/lib/login-logger";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function SignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);

	const handleGoogleSignIn = async () => {
		await signIn.social(
			{
				provider: "google",
				callbackURL: "/auth/profile",
				newUserCallbackURL: "/auth/profile",
			},
			{
				onRequest: () => {
					setLoading(true);
				},
				onResponse: () => {
					setLoading(false);
				},
				onSuccess: async () => {
					// Log successful Google login
					// The API will get the user ID from the session and IP from headers
					await LoginLogger.logSuccessfulLogin(
						"google_user", // Placeholder, API will get real user ID
						undefined, // IP will be extracted from headers by the API
						undefined // User-Agent will be extracted from headers by the API
					);
				},
				onError: async (ctx) => {
					// Log failed Google login
					await LoginLogger.logFailedLogin(
						email || "unknown",
						ctx.error.message || "Google login failed",
						undefined, // IP will be extracted from headers by the API
						undefined // User-Agent will be extracted from headers by the API
					);
					toast.error("Erreur lors de la connexion avec Google");
				},
			}
		);
	};

	const handleEmailSignIn = async () => {
		await signIn.email(
			{
				email,
				password,
				rememberMe,
				callbackURL: "/auth/profile",
			},
			{
				onRequest: () => {
					setLoading(true);
				},
				onResponse: () => {
					setLoading(false);
				},
				onSuccess: async () => {
					// Log successful email login
					// The API will get the user ID from the session and IP from headers
					await LoginLogger.logSuccessfulLogin(
						"email_user", // Placeholder, API will get real user ID
						undefined, // IP will be extracted from headers by the API
						undefined // User-Agent will be extracted from headers by the API
					);
				},
				onError: async (ctx) => {
					// Log failed email login
					await LoginLogger.logFailedLogin(
						email,
						ctx.error.message || "Invalid credentials",
						undefined, // IP will be extracted from headers by the API
						undefined // User-Agent will be extracted from headers by the API
					);

					if (ctx.error.status === 403) {
						alert("Veuillez vérifier votre addresse email");
					}
					toast.error("Le mot de passe ou l'email est incorrect");
				},
			}
		);
	};

	return (
		<Card className="max-w-[30rem] w-full">
			<CardHeader>
				<CardTitle className="text-lg md:text-2xl font-bold text-center">
					Se connecter
				</CardTitle>
				<CardDescription className="text-xs md:text-sm text-center">
					Entrez vos informations ci-dessous pour vous connecter
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="m@example.com"
							required
							onChange={(e) => {
								setEmail(e.target.value);
							}}
							value={email}
						/>
					</div>

					<div className="grid gap-2">
						<div className="flex items-center">
							<Label htmlFor="password">Mot de passe</Label>
							<Link
								href="/auth/forget-password"
								className="ml-auto inline-block text-sm underline"
							>
								Mot de passe oublié ?
							</Link>
						</div>

						<Input
							id="password"
							type="password"
							placeholder="Mot de passe"
							autoComplete="Mot de passe"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							id="remember"
							onClick={() => {
								setRememberMe(!rememberMe);
							}}
						/>
						<Label htmlFor="remember">Se souvenir de moi</Label>
					</div>

					<Button
						type="submit"
						className="w-full py-5"
						disabled={loading}
						onClick={handleEmailSignIn}
					>
						{loading ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<p> Se connecter </p>
						)}
					</Button>

					<div
						className={cn(
							"w-full gap-2 flex items-center",
							"justify-between flex-col"
						)}
					>
						<Button
							variant="outline"
							className={cn("w-full gap-2 py-5")}
							disabled={loading}
							onClick={handleGoogleSignIn}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="0.98em"
								height="1em"
								viewBox="0 0 256 262"
							>
								<path
									fill="#4285F4"
									d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
								></path>
								<path
									fill="#34A853"
									d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
								></path>
								<path
									fill="#FBBC05"
									d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
								></path>
								<path
									fill="#EB4335"
									d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
								></path>
							</svg>
							Se connecter avec Google
						</Button>
					</div>
				</div>
			</CardContent>
			<div className="flex items-center justify-center w-full py-2">
				<p className="text-sm text-muted-foreground">
					Pas encore de compte ?{" "}
					<Link
						href="/auth/register"
						className="underline hover:text-primary"
					>
						Créer un compte
					</Link>
				</p>
			</div>
		</Card>
	);
}
