import { stripe } from "@/lib/utils";
import { NextResponse } from "next/server";

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
