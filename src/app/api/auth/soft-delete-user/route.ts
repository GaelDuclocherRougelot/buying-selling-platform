import { deleteUserAccount } from "@/services/user";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const { userId } = await req.json();
	try {
		await deleteUserAccount(userId);
	} catch {
		return NextResponse.json(
			{ success: false, error: "Failed to delete account" },
			{ status: 500 }
		);
	}
	return NextResponse.json({ success: true });
}
