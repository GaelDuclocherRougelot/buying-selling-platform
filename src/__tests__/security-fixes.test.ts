/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

const getSession = jest.fn();
const getUser = jest.fn();
const checkoutCreate = jest.fn();

jest.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
jest.mock("@/lib/auth-session", () => ({ getUser }));
jest.mock("@/lib/security-log", () => ({
	securityLog: jest.fn(),
	logSqliSuspected: jest.fn(),
}));
jest.mock("@/lib/utils", () => ({
	stripe: { checkout: { sessions: { create: checkoutCreate } } },
}));
jest.mock("@/lib/cloudinary-utils", () => ({}));
jest.mock("@/lib/cache", () => ({
	CACHE_KEYS: { PRODUCT_DETAILS: "product_details" },
	CACHE_TTL: { PRODUCT_DETAILS: 300 },
	cacheUtils: { withCache: (_k: string, fn: () => unknown) => fn() },
}));
jest.mock("@/lib/prisma", () => ({
	prisma: {
		user: { count: jest.fn().mockResolvedValue(0) },
		product: {
			count: jest.fn().mockResolvedValue(0),
			findUnique: jest.fn(),
			update: jest.fn(),
		},
		category: { count: jest.fn().mockResolvedValue(0) },
		payment: {
			aggregate: jest
				.fn()
				.mockResolvedValue({ _count: { id: 0 }, _sum: {} }),
			findFirst: jest.fn().mockResolvedValue(null),
			count: jest.fn().mockResolvedValue(0),
		},
		offer: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
	},
}));

import { prisma } from "@/lib/prisma";
import { GET as adminDashboard } from "@/app/api/admin/dashboard/route";
import { POST as createSession } from "@/app/api/stripe/checkout/create-session/route";
import { POST as respondToOffer } from "@/app/api/messages/offers/[offerId]/respond/route";
import { GET as getProduct } from "@/app/api/products/[productId]/route";

const db = prisma as unknown as {
	product: Record<string, jest.Mock>;
	offer: Record<string, jest.Mock>;
	payment: Record<string, jest.Mock>;
};

const req = (url: string, body?: unknown) =>
	new NextRequest(`http://localhost${url}`, {
		method: body ? "POST" : "GET",
		body: body ? JSON.stringify(body) : undefined,
	});

const product = (status: string) => ({
	id: "p1",
	title: "Chaise",
	description: null,
	price: 50,
	deliveryPrice: 5,
	status,
	ownerId: "seller",
	owner: { stripeAccountId: "acct_1" },
	category: { name: "meubles" },
});

beforeEach(() => {
	jest.clearAllMocks();
	checkoutCreate.mockResolvedValue({ id: "cs_1", url: "https://stripe" });
});

describe("routes admin", () => {
	it("401 sans session", async () => {
		getSession.mockResolvedValue(null);
		const res = await adminDashboard(req("/api/admin/dashboard"));
		expect(res.status).toBe(401);
	});

	it("403 avec le rôle user", async () => {
		getSession.mockResolvedValue({ user: { id: "u1", role: "user" } });
		const res = await adminDashboard(req("/api/admin/dashboard"));
		expect(res.status).toBe(403);
	});
});

describe("create-session", () => {
	beforeEach(() =>
		getSession.mockResolvedValue({ user: { id: "buyer", role: "user" } })
	);

	it("ignore le prix forcé par le client", async () => {
		db.product.findUnique.mockResolvedValue(product("active"));
		db.offer.findFirst.mockResolvedValue(null);

		const res = await createSession(
			req("/api/stripe/checkout/create-session", {
				productId: "p1",
				amount: 0.01,
			})
		);

		expect(res.status).toBe(200);
		const lineItem = checkoutCreate.mock.calls[0][0].line_items[0];
		expect(lineItem.price_data.unit_amount).toBe(5500); // 50 € + 5 € de port
	});

	it("refuse un tiers sur un produit réservé", async () => {
		db.product.findUnique.mockResolvedValue(product("waiting_payment"));
		db.offer.findFirst.mockResolvedValue(null);

		const res = await createSession(
			req("/api/stripe/checkout/create-session", { productId: "p1" })
		);

		expect(res.status).toBe(403);
		expect(checkoutCreate).not.toHaveBeenCalled();
	});
});

describe("réponse à une offre", () => {
	it("un refus garde le produit actif", async () => {
		getUser.mockResolvedValue({ id: "seller" });
		db.offer.findUnique.mockResolvedValue({
			id: "o1",
			status: "pending",
			conversation: {
				productId: "p1",
				product: { ownerId: "seller", status: "active" },
			},
		});

		const res = await respondToOffer(
			req("/api/messages/offers/o1/respond", { response: "rejected" }),
			{ params: Promise.resolve({ offerId: "o1" }) }
		);

		expect(res.status).toBe(200);
		expect(db.offer.update).toHaveBeenCalledWith({
			where: { id: "o1" },
			data: { status: "rejected" },
		});
		expect(db.product.update).not.toHaveBeenCalled();
	});
});

describe("GET /api/products/[productId]", () => {
	it("n'expose pas l'email du vendeur", async () => {
		db.product.findUnique.mockResolvedValue({ id: "p1", owner: { id: "s" } });

		const res = await getProduct(new Request("http://localhost/api/products/p1"));

		expect(res.status).toBe(200);
		const select = db.product.findUnique.mock.calls[0][0].include.owner.select;
		expect(select).not.toHaveProperty("email");
		expect(select).not.toHaveProperty("stripeAccountId");
		expect(select).not.toHaveProperty("role");
		expect(JSON.stringify(await res.json())).not.toContain("email");
	});
});
