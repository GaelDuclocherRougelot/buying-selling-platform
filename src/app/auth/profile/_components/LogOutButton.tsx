"use client";
import { LogoutButton } from "@/components/auth/logout-button";

export default function LogOutButton() {
	return (
		<LogoutButton variant="outline" className="cursor-pointer">
			Déconnexion
		</LogoutButton>
	);
}
