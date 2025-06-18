import { stripe } from "@/lib/utils";
import { NextResponse } from "next/server";


/**
 * @swagger
 * /api/stripe/create-account:
 *   post:
 *     description: Create a new Stripe account
 *     responses:
 *       200:
 *         description: Stripe account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created Stripe account
 *       500:
 *         description: Internal Server Error
 */
export default async function POST() {
	try {
		const account = await stripe.accounts.create({});

		return NextResponse.json(account);
	} catch {
		return NextResponse.json(
			{ error: "Stripe api error while creating account" },
			{ status: 500 }
		);
	}
}