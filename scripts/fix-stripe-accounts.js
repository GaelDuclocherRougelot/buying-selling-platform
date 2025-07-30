import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixStripeAccounts() {
	try {
		console.log("🔧 Correction des comptes Stripe...");

		// 1. Nettoyer les stripeAccountId vides ou invalides
		const usersWithInvalidStripe = await prisma.user.findMany({
			where: {
				OR: [
					{ stripeAccountId: "" },
					{ stripeAccountId: null },
					{ stripeAccountId: undefined },
				],
			},
			select: {
				id: true,
				email: true,
				stripeAccountId: true,
				stripeAccountStatus: true,
			},
		});

		console.log(
			`📊 ${usersWithInvalidStripe.length} utilisateurs avec un stripeAccountId invalide trouvés`
		);

		for (const user of usersWithInvalidStripe) {
			console.log(
				`🧹 Nettoyage de l'utilisateur ${user.email} (${user.id})`
			);
			await prisma.user.update({
				where: { id: user.id },
				data: {
					stripeAccountId: null,
					stripeAccountStatus: null,
				},
			});
		}

		// 2. Vérifier les stripeAccountId qui ne commencent pas par "acct_"
		const usersWithInvalidStripeFormat = await prisma.user.findMany({
			where: {
				stripeAccountId: {
					not: null,
					not: "",
				},
				AND: {
					stripeAccountId: {
						not: {
							startsWith: "acct_",
						},
					},
				},
			},
			select: {
				id: true,
				email: true,
				stripeAccountId: true,
				stripeAccountStatus: true,
			},
		});

		console.log(
			`📊 ${usersWithInvalidStripeFormat.length} utilisateurs avec un format stripeAccountId invalide trouvés`
		);

		for (const user of usersWithInvalidStripeFormat) {
			console.log(
				`🧹 Nettoyage de l'utilisateur ${user.email} (${user.id}) - stripeAccountId invalide: ${user.stripeAccountId}`
			);
			await prisma.user.update({
				where: { id: user.id },
				data: {
					stripeAccountId: null,
					stripeAccountStatus: null,
				},
			});
		}

		console.log("✅ Correction terminée !");
	} catch (error) {
		console.error("❌ Erreur lors de la correction:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// Exécuter le script
fixStripeAccounts();
