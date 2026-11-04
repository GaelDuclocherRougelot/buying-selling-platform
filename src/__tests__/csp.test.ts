/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

jest.mock("better-auth/cookies", () => ({ getSessionCookie: jest.fn() }));

describe("CSP (hors développement)", () => {
	it("n'autorise ni eval, ni scripts inline sans nonce, ni CDN publics, ni WebSocket", async () => {
		const response = await middleware(new NextRequest("http://localhost/"));
		const csp = response.headers.get("Content-Security-Policy") ?? "";
		const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src"));

		expect(scriptSrc).toMatch(/'nonce-[^']+'/);
		expect(scriptSrc).not.toContain("unsafe-eval");
		expect(scriptSrc).not.toContain("unsafe-inline");
		expect(csp).not.toMatch(/unpkg\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/);
		expect(csp).not.toMatch(/\bwss?:(?!\/\/)/);
		expect(csp).toContain("frame-ancestors 'none'");
	});
});
