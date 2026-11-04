import { PostHog } from "posthog-node";

/**
 * Client PostHog côté serveur (serverless / Vercel).
 * flushAt: 1 + flushInterval: 0 pour envoyer immédiatement ;
 * toujours appeler `await client.shutdown()` avant la fin de la requête.
 * Retourne null si PostHog n'est pas configuré.
 */
export function createPostHogServerClient(): PostHog | null {
	const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	if (!key) return null;
	return new PostHog(key, {
		host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
		flushAt: 1,
		flushInterval: 0,
	});
}
