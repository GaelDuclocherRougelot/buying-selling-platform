import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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
			select: {
				stripeAccountId: true,
				stripeAccountStatus: true,
			},
		});

		return NextResponse.json({
			hasStripeAccount: !!user?.stripeAccountId,
			stripeAccountStatus: user?.stripeAccountStatus || "none",
			canSell:
				user?.stripeAccountStatus === "active" ||
				user?.stripeAccountStatus === "charges_only",
		});
	} catch (error) {
		console.error("Error checking Stripe status:", error);
		return NextResponse.json(
			{ error: "Failed to check Stripe status" },
			{ status: 500 }
		);
	}
}
