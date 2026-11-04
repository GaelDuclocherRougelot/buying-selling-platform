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
