import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupStripeAccounts() {
	try {
		console.log("🔍 Vérification des comptes Stripe...");

		// 1. Trouver tous les utilisateurs avec stripeAccountId
		const usersWithStripe = await prisma.user.findMany({
			where: {
				stripeAccountId: {
					not: null,
				},
			},
			select: {
				id: true,
				email: true,
				name: true,
				stripeAccountId: true,
				stripeAccountStatus: true,
				createdAt: true,
			},
		});

		console.log(
			`📊 ${usersWithStripe.length} utilisateurs avec un stripeAccountId trouvés`
		);

		// Afficher les utilisateurs trouvés
		usersWithStripe.forEach((user) => {
			console.log(
				`- ${user.email} (${user.id}): ${user.stripeAccountId}`
			);
		});

		// 2. Vérifier les doublons
		const stripeAccountIds = usersWithStripe.map((u) => u.stripeAccountId);
		const uniqueIds = [...new Set(stripeAccountIds)];

		if (stripeAccountIds.length !== uniqueIds.length) {
			console.log("⚠️  Doublons détectés dans stripeAccountId");

			// Trouver les doublons
			const duplicates = stripeAccountIds.filter(
				(id, index) => stripeAccountIds.indexOf(id) !== index
			);

			console.log("🔧 Nettoyage des doublons...");

			for (const duplicateId of [...new Set(duplicates)]) {
				const usersWithDuplicate = usersWithStripe.filter(
					(u) => u.stripeAccountId === duplicateId
				);

				console.log(
					`\n🔍 Doublon trouvé pour stripeAccountId: ${duplicateId}`
				);
				usersWithDuplicate.forEach((user) => {
					console.log(
						`  - ${user.email} (${user.id}) créé le ${user.createdAt}`
					);
				});

				// Garder le plus récent, nettoyer les autres
				const sortedUsers = usersWithDuplicate.sort(
					(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
				);

				const usersToClean = sortedUsers.slice(1);

				for (const userToClean of usersToClean) {
					console.log(
						`🧹 Nettoyage de l'utilisateur ${userToClean.email} (${userToClean.id})`
					);
					await prisma.user.update({
						where: { id: userToClean.id },
						data: {
							stripeAccountId: null,
							stripeAccountStatus: null,
						},
					});
				}
			}
		} else {
			console.log("✅ Aucun doublon détecté");
		}

		console.log("✅ Nettoyage terminé !");
	} catch (error) {
		console.error("❌ Erreur lors du nettoyage:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// Exécuter le script
cleanupStripeAccounts();
