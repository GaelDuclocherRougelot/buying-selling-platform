import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCategoriesPage() {
	try {
		console.log("🧪 Test de la page des catégories...");

		// 1. Vérifier les catégories existantes
		const categories = await prisma.category.findMany({
			select: {
				id: true,
				name: true,
				displayName: true,
				_count: {
					select: {
						products: true,
					},
				},
			},
			orderBy: {
				displayName: "asc",
			},
		});

		console.log(`📊 ${categories.length} catégories trouvées:`);
		categories.forEach((category) => {
			console.log(
				`  - ${category.displayName} (${category.name}): ${category._count.products} produits`
			);
		});

		// 2. Vérifier les catégories avec des produits
		const categoriesWithProducts = categories.filter(
			(cat) => cat._count.products > 0
		);
		console.log(
			`\n✅ ${categoriesWithProducts.length} catégories avec des produits:`
		);
		categoriesWithProducts.forEach((category) => {
			console.log(
				`  - ${category.displayName}: ${category._count.products} produits`
			);
		});

		// 3. Vérifier les catégories vides
		const emptyCategories = categories.filter(
			(cat) => cat._count.products === 0
		);
		console.log(`\n⚠️  ${emptyCategories.length} catégories vides:`);
		emptyCategories.forEach((category) => {
			console.log(`  - ${category.displayName}`);
		});

		console.log("\n✅ Test terminé !");
		console.log("\n📝 URLs à tester:");
		console.log("  - Page principale: /categories");
		categoriesWithProducts.forEach((category) => {
			console.log(
				`  - Catégorie ${category.displayName}: /categories/${category.name}`
			);
		});
	} catch (error) {
		console.error("❌ Erreur lors du test:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// Exécuter le script
testCategoriesPage();
