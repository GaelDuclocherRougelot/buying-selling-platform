"use client";

import { openCookieBanner } from "@/lib/consent";

/** Rouvre le bandeau de consentement cookies. */
export default function ManageCookiesLink() {
	return (
		<button
			type="button"
			onClick={openCookieBanner}
			className="text-foreground hover:underline cursor-pointer"
		>
			Gérer les cookies
		</button>
	);
}
