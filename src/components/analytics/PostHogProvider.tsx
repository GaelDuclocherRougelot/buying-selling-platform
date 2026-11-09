"use client";

import { useSession } from "@/lib/auth-client";
import { identifyUser, resetAnalytics } from "@/lib/analytics";
import { CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from "@/lib/consent";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect, useRef, useState } from "react";

declare global {
	interface Window {
		posthog?: typeof posthog;
	}
}

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

function initPostHog() {
	if (!POSTHOG_KEY || posthog.__loaded) return;
	posthog.init(POSTHOG_KEY, {
		// Reverse proxy (next.config rewrites) : évite les bloqueurs et garde la CSP en 'self'
		api_host: "/ingest",
		ui_host: "https://eu.posthog.com",
		// CNIL : aucune capture ni persistance (cookie/localStorage) avant consentement
		opt_out_capturing_by_default: true,
		opt_out_persistence_by_default: true,
		persistence: "localStorage+cookie",
		person_profiles: "identified_only",
		// Pageviews capturés manuellement (navigation client App Router)
		capture_pageview: false,
		capture_pageleave: true,
		// Replay : champs masqués ; les éléments .ph-no-capture sont exclus de l'enregistrement
		session_recording: {
			maskAllInputs: true,
		},
		loaded: (ph) => {
			// Exposé comme le snippet officiel (debug, scripts de trafic synthétique)
			window.posthog = posthog;
			if (hasAnalyticsConsent()) ph.opt_in_capturing();
		},
	});
}

if (typeof window !== "undefined") initPostHog();

function PageviewTracker() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		if (!pathname || !posthog.__loaded) return;
		const query = searchParams?.toString();
		const url = window.location.origin + pathname + (query ? `?${query}` : "");
		posthog.capture("$pageview", { $current_url: url });
	}, [pathname, searchParams]);

	return null;
}

/** identify() avec l'id uniquement ; reset() quand la session disparaît. */
function IdentityTracker() {
	const { data: session, isPending } = useSession();
	const userId = session?.user?.id;
	const previousUserId = useRef<string | undefined>(undefined);
	const [consentVersion, setConsentVersion] = useState(0);

	useEffect(() => {
		// opt_in/opt_out est appliqué par le bandeau ; on ré-identifie après accord
		const onChange = () => setConsentVersion((v) => v + 1);
		window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
		return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
	}, []);

	useEffect(() => {
		if (isPending) return;
		if (userId) {
			if (hasAnalyticsConsent()) identifyUser(userId);
		} else if (previousUserId.current) {
			resetAnalytics(hasAnalyticsConsent());
		}
		previousUserId.current = userId;
	}, [userId, isPending, consentVersion]);

	return null;
}

export default function PostHogProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	if (!POSTHOG_KEY) return <>{children}</>;
	return (
		<PHProvider client={posthog}>
			<Suspense fallback={null}>
				<PageviewTracker />
			</Suspense>
			<IdentityTracker />
			{children}
		</PHProvider>
	);
}
