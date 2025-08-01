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

export async function getAllUsers(page: number = 1, limit: number = 8) {
	const skip = (page - 1) * limit;

	const [users, totalCount] = await Promise.all([
		prisma.user.findMany({
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
		}),
		prisma.user.count(),
	]);

	return {
		users,
		pagination: {
			currentPage: page,
			totalPages: Math.ceil(totalCount / limit),
			totalUsers: totalCount,
			usersPerPage: limit,
			hasNextPage: page < Math.ceil(totalCount / limit),
			hasPreviousPage: page > 1,
		},
	};
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
