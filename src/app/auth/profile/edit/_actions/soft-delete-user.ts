"use server";

import { deleteUserAccount } from "@/services/user";

export async function handleDeleteUserAccount(userId: string) {
	await deleteUserAccount(userId);
	return { success: true };
}
