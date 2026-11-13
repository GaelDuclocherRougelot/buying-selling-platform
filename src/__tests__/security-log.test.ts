/**
 * @jest-environment node
 */
import { readFile, rm } from "fs/promises";
import path from "path";
import { logSqliSuspected, looksLikeSqli, securityLog } from "@/lib/security-log";

const LOG_FILE = path.join(process.cwd(), "logs", "security.json");

describe("securityLog", () => {
	beforeEach(() => rm(LOG_FILE, { force: true }));
	afterAll(() => rm(LOG_FILE, { force: true }));

	it("écrit une ligne JSON lisible par Wazuh", async () => {
		const headers = new Headers({
			"x-forwarded-for": "203.0.113.7, 10.0.0.1",
			"user-agent": "curl/8",
		});
		await securityLog("auth.login_failed", headers, { email: "a@b.c" });
		await securityLog("authz.denied", headers);

		const lines = (await readFile(LOG_FILE, "utf8")).trim().split("\n");
		expect(lines).toHaveLength(2);
		const event = JSON.parse(lines[0]);
		expect(event).toMatchObject({
			siem_event: "auth.login_failed",
			srcip: "203.0.113.7",
			userAgent: "curl/8",
			email: "a@b.c",
		});
		expect(Date.parse(event.ts)).not.toBeNaN();
	});

	it("détecte les motifs d'injection SQL sans faux positif évident", () => {
		for (const payload of [
			"' OR 1=1",
			"x' or '1'='1",
			"1 UNION SELECT password FROM \"user\"",
			"admin'--",
			"1; DROP TABLE product",
			"1 AND SLEEP(5)",
			"1; SELECT PG_SLEEP(5)",
		]) {
			expect(looksLikeSqli(payload)).toBe(true);
		}
		for (const clean of ["vélo d'occasion", "t-shirt rouge", "union jack", 42]) {
			expect(looksLikeSqli(clean)).toBe(false);
		}
	});

	it("journalise input.sqli_suspected avec un payload tronqué à 200 caractères", async () => {
		const headers = new Headers({ "x-forwarded-for": "203.0.113.7" });
		await logSqliSuspected(headers, "/api/products/search", {
			q: "' OR 1=1 " + "A".repeat(500),
			page: "1",
		});
		await logSqliSuspected(headers, "/api/products/search", { q: "vélo" });

		const lines = (await readFile(LOG_FILE, "utf8")).trim().split("\n");
		expect(lines).toHaveLength(1);
		const event = JSON.parse(lines[0]);
		expect(event).toMatchObject({
			siem_event: "input.sqli_suspected",
			path: "/api/products/search",
			param: "q",
		});
		expect(event.payload).toHaveLength(200);
	});
});
