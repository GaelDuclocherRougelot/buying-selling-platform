// app/api/delete-user/route.ts
import { getUser } from "@/lib/auth-session";
import { deleteUserAccount } from "@/services/user";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const user = await getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { userId } = await req.json();

	// Par sécurité, tu peux vérifier que l'userId correspond à session.user.id
	if (user.id !== userId) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	await deleteUserAccount(userId);

	return NextResponse.json({ success: true });
}
