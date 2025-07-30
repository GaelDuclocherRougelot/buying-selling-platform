import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testStripeFlow() {
	try {
		console.log("🧪 Test du flux Stripe...");

		// 1. Vérifier les utilisateurs avec des comptes Stripe
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
			},
		});

		console.log(
			`📊 ${usersWithStripe.length} utilisateurs avec un compte Stripe:`
		);
		usersWithStripe.forEach((user) => {
			console.log(
				`  - ${user.email}: ${user.stripeAccountStatus} (${user.stripeAccountId})`
			);
		});

		// 2. Vérifier les utilisateurs qui peuvent vendre
		const canSellUsers = usersWithStripe.filter(
			(user) =>
				user.stripeAccountStatus === "active" ||
				user.stripeAccountStatus === "charges_only"
		);

		console.log(`\n✅ ${canSellUsers.length} utilisateurs peuvent vendre:`);
		canSellUsers.forEach((user) => {
			console.log(`  - ${user.email}: ${user.stripeAccountStatus}`);
		});

		// 3. Vérifier les utilisateurs en attente
		const pendingUsers = usersWithStripe.filter(
			(user) => user.stripeAccountStatus === "pending"
		);

		console.log(`\n⚠️  ${pendingUsers.length} utilisateurs en attente:`);
		pendingUsers.forEach((user) => {
			console.log(`  - ${user.email}: ${user.stripeAccountStatus}`);
		});

		console.log("\n✅ Test terminé !");
	} catch (error) {
		console.error("❌ Erreur lors du test:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// Exécuter le script
testStripeFlow();
