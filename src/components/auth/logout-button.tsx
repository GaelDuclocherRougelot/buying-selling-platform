"use client";

import { Button } from "@/components/ui/button";
import { resetAnalytics } from "@/lib/analytics";
import { signOut, useSession } from "@/lib/auth-client";
import { hasAnalyticsConsent } from "@/lib/consent";
import { LoginLogger } from "@/lib/login-logger";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	size?: "default" | "sm" | "lg" | "icon";
	children?: React.ReactNode;
	className?: string;
}

export function LogoutButton({
	variant = "outline",
	size = "default",
	children = "Se déconnecter",
	className,
}: LogoutButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const { data: session } = useSession();
	const router = useRouter();

	const handleLogout = async () => {
		setIsLoading(true);
		try {
			// Logger la déconnexion
			if (session?.user?.id) {
				await LoginLogger.logLogout(
					session.user.id,
					undefined, // IP sera récupérée côté serveur
					navigator.userAgent
				);
			}

			// Effectuer la déconnexion
			await signOut();
			resetAnalytics(hasAnalyticsConsent());
		} catch (error) {
			console.error("Erreur lors de la déconnexion:", error);
		} finally {
			setIsLoading(false);
			router.push("/");
		}
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleLogout}
			disabled={isLoading}
			className={className}
		>
			{isLoading ? "Déconnexion..." : children}
		</Button>
	);
}
