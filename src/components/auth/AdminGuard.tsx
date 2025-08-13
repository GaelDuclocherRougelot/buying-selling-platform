"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface AdminGuardProps {
	children: ReactNode;
	fallback?: ReactNode;
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (isPending) return;

		if (!session?.user) {
			router.push("/login");
			return;
		}

		if (session.user.role !== "admin") {
			router.push("/unauthorized");
			return;
		}
	}, [session, isPending, router]);

	// Afficher un loader pendant la vérification
	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	// Si l'utilisateur n'est pas connecté ou n'est pas admin, afficher le fallback
	if (!session?.user || session.user.role !== "admin") {
		return fallback || null;
	}

	// Si l'utilisateur est admin, afficher le contenu
	return <>{children}</>;
}
