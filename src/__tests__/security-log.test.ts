/**
 * @jest-environment node
 */
import { readFile, rm } from "fs/promises";
import path from "path";
import { securityLog } from "@/lib/security-log";

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
});
