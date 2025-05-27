"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function LogOutButton() {
	return (
		<Button
            variant="outline"
            className="cursor-pointer"
			onClick={() => {
				signOut();
				redirect("/");
			}}
		>
			Déconnexion
		</Button>
	);
}
