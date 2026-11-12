/**
 * @jest-environment node
 */
import { POST as respondToOffer } from "@/app/api/messages/offers/[offerId]/respond/route";
import { POST as createSession } from "@/app/api/stripe/checkout/create-session/route";
import { auth } from "@/lib/auth";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
	prisma: {
		product: { findUnique: jest.fn(), update: jest.fn() },
		offer: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
		payment: { findFirst: jest.fn() },
	},
}));
jest.mock("@/lib/auth", () => ({
	auth: { api: { getSession: jest.fn() } },
}));
jest.mock("@/lib/auth-session", () => ({ getUser: jest.fn() }));
jest.mock("@/lib/utils", () => ({
	stripe: { checkout: { sessions: { create: jest.fn() } } },
}));
jest.mock("@/lib/platform-fees", () => ({
	...jest.requireActual("@/lib/platform-fees"),
	getSellerSalesCount: jest.fn().mockResolvedValue(0),
}));
jest.mock("@/lib/security-log", () => ({ securityLog: jest.fn() }));

const product = {
	id: "product_1",
	title: "Chaise design",
	description: null,
	price: 100,
	status: "active",
	ownerId: "seller_1",
	owner: { stripeAccountId: "acct_seller" },
	category: { name: "meubles" },
};

function checkoutRequest(body: Record<string, unknown>) {
	return new NextRequest(
		"http://localhost:3000/api/stripe/checkout/create-session",
		{ method: "POST", body: JSON.stringify(body) }
	);
}

function chargedAmountInCents() {
	const [params] = (stripe.checkout.sessions.create as jest.Mock).mock.calls[0];
	return params.line_items[0].price_data.unit_amount;
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(console, "log").mockImplementation(() => {});
	(auth.api.getSession as unknown as jest.Mock).mockResolvedValue({
		user: { id: "buyer_1" },
	});
	(prisma.payment.findFirst as jest.Mock).mockResolvedValue(null);
	(prisma.offer.findFirst as jest.Mock).mockResolvedValue(null);
	(stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
		id: "cs_test",
		url: "https://checkout.stripe.com/cs_test",
	});
});

describe("POST /api/stripe/checkout/create-session", () => {
	it("ignore le prix envoyé par le client et facture le prix du produit", async () => {
		(prisma.product.findUnique as jest.Mock).mockResolvedValue(product);

		const res = await createSession(
			checkoutRequest({ productId: "product_1", amount: 1 })
		);

		expect(res.status).toBe(200);
		expect(chargedAmountInCents()).toBe(10000);
	});

	it("facture le montant de l'offre acceptée de l'acheteur", async () => {
		(prisma.product.findUnique as jest.Mock).mockResolvedValue({
			...product,
			status: "waiting_payment",
		});
		(prisma.offer.findFirst as jest.Mock).mockResolvedValue({ amount: 80 });

		const res = await createSession(
			checkoutRequest({ productId: "product_1", amount: 1 })
		);

		expect(res.status).toBe(200);
		expect(prisma.offer.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					status: "accepted",
					conversation: { productId: "product_1", buyerId: "buyer_1" },
				},
			})
		);
		expect(chargedAmountInCents()).toBe(8000);
	});

	it("refuse (403) un tiers sur un produit réservé", async () => {
		(prisma.product.findUnique as jest.Mock).mockResolvedValue({
			...product,
			status: "waiting_payment",
		});

		const res = await createSession(
			checkoutRequest({ productId: "product_1", amount: 100 })
		);

		expect(res.status).toBe(403);
		expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
	});

	it("refuse un produit ni actif ni réservé", async () => {
		(prisma.product.findUnique as jest.Mock).mockResolvedValue({
			...product,
			status: "pending",
		});

		const res = await createSession(
			checkoutRequest({ productId: "product_1", amount: 100 })
		);

		expect(res.status).toBe(400);
		expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
	});
});

describe("POST /api/messages/offers/[offerId]/respond", () => {
	const offer = {
		id: "offer_1",
		status: "pending",
		conversation: {
			productId: "product_1",
			buyerId: "buyer_1",
			sellerId: "seller_1",
		},
	};

	function respond(response: "accepted" | "rejected") {
		return respondToOffer(
			new NextRequest(
				"http://localhost:3000/api/messages/offers/offer_1/respond",
				{ method: "POST", body: JSON.stringify({ response }) }
			),
			{ params: Promise.resolve({ offerId: "offer_1" }) }
		);
	}

	beforeEach(() => {
		(getUser as jest.Mock).mockResolvedValue({ id: "seller_1" });
		(prisma.offer.findUnique as jest.Mock).mockResolvedValue(offer);
	});

	it("laisse le produit actif quand l'offre est refusée", async () => {
		const res = await respond("rejected");

		expect(res.status).toBe(200);
		expect(prisma.offer.update).toHaveBeenCalledWith({
			where: { id: "offer_1" },
			data: { status: "rejected" },
		});
		expect(prisma.product.update).not.toHaveBeenCalled();
	});

	it("réserve le produit quand l'offre est acceptée", async () => {
		const res = await respond("accepted");

		expect(res.status).toBe(200);
		expect(prisma.product.update).toHaveBeenCalledWith({
			where: { id: "product_1" },
			data: { status: "waiting_payment" },
		});
	});
});
