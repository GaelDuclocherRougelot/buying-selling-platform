import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { stripeAccountId: true },
		});

		if (!user?.stripeAccountId) {
			return NextResponse.json(
				{ error: "No Stripe account found" },
				{ status: 404 }
			);
		}

		// Create account link for onboarding
		const accountLink = await stripe.accountLinks.create({
			account: user.stripeAccountId,
			refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile/connect`,
			return_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/profile/connect`,
			type: "account_onboarding",
		});

		return NextResponse.json({ url: accountLink.url });
	} catch (error) {
		console.error("Error creating account link:", error);
		return NextResponse.json(
			{ error: "Failed to create account link" },
			{ status: 500 }
		);
	}
}
