import { prisma } from "@/lib/prisma";

export async function deleteUserAccount(userId: string) {
	// Supprimer les comptes et sessions
	await prisma.account.deleteMany({
		where: { userId },
	});

	await prisma.session.deleteMany({
		where: { userId },
	});

	// Soft delete l'utilisateur
	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: { deletedAt: new Date() },
	});

	if (!updatedUser) {
		throw new Error("User not found or already deleted");
	}

	return updatedUser;
}

export async function getUserByUsername(username: string) {
	const user = await prisma.user.findFirst({
		where: { username },
	});
	return user;
}

export async function getAllUsers() {
	const users = await prisma.user.findMany();
	return users;
}

export async function getAllVerifiedUsersCount() {
	const count = await prisma.user.count({
		where: { emailVerified: true },
	});
	return count;
}

export async function getAllUsersCount() {
	const count = await prisma.user.count();
	return count;
}
