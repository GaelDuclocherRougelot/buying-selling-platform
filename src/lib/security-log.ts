import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { getConnectionInfo } from "./login-logger";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "security.json");

/**
 * Écrit un événement de sécurité (une ligne JSON) lu par le SIEM Wazuh.
 * Ne lève jamais : un échec de log ne doit pas casser la requête.
 */
export async function securityLog(
	event: string,
	headers: Headers,
	fields: Record<string, unknown> = {}
): Promise<void> {
	const { ipAddress, userAgent } = getConnectionInfo(headers);
	const line = JSON.stringify({
		ts: new Date().toISOString(),
		app: "buying-selling-platform",
		siem_event: event,
		srcip: ipAddress,
		userAgent,
		...fields,
	});
	try {
		await mkdir(LOG_DIR, { recursive: true });
		await appendFile(LOG_FILE, line + "\n");
	} catch (error) {
		console.error("Erreur lors de l'écriture du log de sécurité:", error);
	}
}

// Motifs SQL typiques : ' OR 1=1, UNION SELECT, commentaire --, ; DROP, SLEEP(…)
const SQLI_PATTERN =
	/'\s*(or|and)\s+['"\d]|union\s+(all\s+)?select|--(\s|$)|;\s*drop\s|sleep\s*\(/i;

export function looksLikeSqli(value: unknown): value is string {
	return typeof value === "string" && SQLI_PATTERN.test(value);
}

/**
 * Journalise "input.sqli_suspected" pour le premier paramètre qui contient un
 * motif d'injection SQL. Détection seulement : Prisma paramètre déjà les
 * requêtes, la saisie n'est donc pas bloquée.
 */
export async function logSqliSuspected(
	headers: Headers,
	path: string,
	params: Record<string, unknown>
): Promise<void> {
	const hit = Object.entries(params).find(([, value]) => looksLikeSqli(value));
	if (!hit) return;
	await securityLog("input.sqli_suspected", headers, {
		path,
		param: hit[0],
		// tronqué : on garde une trace du payload sans remplir le disque
		payload: (hit[1] as string).slice(0, 200),
	});
}
