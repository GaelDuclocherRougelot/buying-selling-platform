import { getUserByUsername } from "@/services/user";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
	const username = req.nextUrl.searchParams.get("username");

	if (!username) {
		return NextResponse.json(
			{ error: "Aucun nom d'utilisateur fourni" },
			{
				status: 400,
			}
		);
	}

	try {
		const user = await getUserByUsername(username);
		if (!user) {
			return NextResponse.json(
				{ avalaible: true },
				{
					status: 200,
				}
			);
		}
		return NextResponse.json(
			{ available: false },
			{
				status: 200,
			}
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
	}
}
