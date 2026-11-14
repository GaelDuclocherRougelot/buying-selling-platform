/**
 * @jest-environment node
 *
 * Le middleware exclut /api : chaque route admin doit refuser elle-même
 * un anonyme (401) et un utilisateur sans rôle admin (403).
 */
import { NextRequest } from "next/server";

let currentUser: { id: string; role: string } | null = null;

jest.mock("@/lib/auth", () => ({
	auth: {
		api: {
			getSession: jest.fn(async () =>
				currentUser ? { user: currentUser } : null
			),
		},
	},
}));
jest.mock("@/lib/auth-session", () => ({
	getUser: jest.fn(async () => currentUser),
}));
jest.mock("@/lib/security-log", () => ({ securityLog: jest.fn() }));
jest.mock("@/lib/utils", () => ({ stripe: {} }));
// cache.ts lance un setInterval qui empêche Jest de se terminer
jest.mock("@/lib/cache", () => ({ CACHE_KEYS: {}, CACHE_TTL: {}, cacheUtils: {} }));
// Toute requête en base fait échouer le test : le refus doit venir avant
jest.mock("@/lib/prisma", () => ({
	prisma: new Proxy(
		{},
		{
			get: (_t, model) => {
				throw new Error(`accès prisma.${String(model)} avant le contrôle`);
			},
		}
	),
}));

import * as categories from "@/app/api/admin/categories/route";
import * as category from "@/app/api/admin/categories/[categoryId]/route";
import * as dashboard from "@/app/api/admin/dashboard/route";
import * as loginLogs from "@/app/api/admin/login-logs/route";
import * as loginStats from "@/app/api/admin/login-logs/stats/route";
import * as productPayments from "@/app/api/admin/products/[productId]/payments/route";
import * as product from "@/app/api/admin/products/[productId]/route";
import * as products from "@/app/api/admin/products/route";
import * as proofVerify from "@/app/api/admin/shipping-proofs/[proofId]/verify/route";
import * as proofs from "@/app/api/admin/shipping-proofs/route";
import * as usersCount from "@/app/api/admin/users/count/route";
import * as users from "@/app/api/admin/users/route";
import * as errorLog from "@/app/api/error-log/route";

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

const params = { categoryId: "c1", productId: "p1", proofId: "pr1" };

// [chemin, méthode, handler]
const routes: [string, string, unknown][] = [
	["/api/admin/categories", "GET", categories.GET],
	["/api/admin/categories", "POST", categories.POST],
	["/api/admin/categories/c1", "PUT", category.PUT],
	["/api/admin/categories/c1", "DELETE", category.DELETE],
	["/api/admin/dashboard", "GET", dashboard.GET],
	["/api/admin/login-logs", "GET", loginLogs.GET],
	["/api/admin/login-logs", "POST", loginLogs.POST],
	["/api/admin/login-logs/stats", "GET", loginStats.GET],
	["/api/admin/products", "GET", products.GET],
	["/api/admin/products", "POST", products.POST],
	["/api/admin/products/p1", "PUT", product.PUT],
	["/api/admin/products/p1", "DELETE", product.DELETE],
	["/api/admin/products/p1/payments", "GET", productPayments.GET],
	["/api/admin/shipping-proofs", "GET", proofs.GET],
	["/api/admin/shipping-proofs/pr1/verify", "PUT", proofVerify.PUT],
	["/api/admin/shipping-proofs/pr1/verify", "POST", proofVerify.POST],
	["/api/admin/users", "GET", users.GET],
	["/api/admin/users", "POST", users.POST],
	["/api/admin/users/count", "GET", usersCount.GET],
	["/api/error-log", "GET", errorLog.GET],
	["/api/error-log", "DELETE", errorLog.DELETE],
];

const call = (path: string, method: string, handler: unknown) =>
	(handler as Handler)(
		new NextRequest(`http://localhost${path}`, {
			method,
			body: method === "GET" || method === "DELETE" ? undefined : "{}",
		}),
		{ params: Promise.resolve(params) }
	);

describe.each(routes)("%s %s", (path, method, handler) => {
	it("401 sans session", async () => {
		currentUser = null;
		expect((await call(path, method, handler)).status).toBe(401);
	});

	it("403 avec le rôle user", async () => {
		currentUser = { id: "u1", role: "user" };
		expect((await call(path, method, handler)).status).toBe(403);
	});
});
