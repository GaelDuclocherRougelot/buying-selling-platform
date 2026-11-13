// ponytail: mémoire par instance (comme le rateLimit de better-auth) ; sur Vercel
// chaque instance a son compteur. Passer à un stockage partagé (Redis/DB) si besoin.
const hits = new Map<string, number[]>();

/** true si la requête est autorisée, false si `max` est atteint sur la fenêtre. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
	const now = Date.now();
	if (hits.size > 10_000) hits.clear();
	const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
	const allowed = recent.length < max;
	if (allowed) recent.push(now);
	hits.set(key, recent);
	return allowed;
}
