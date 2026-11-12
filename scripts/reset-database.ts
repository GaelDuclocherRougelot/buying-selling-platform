#!/usr/bin/env tsx

/**
 * Remise à zéro complète : vide toutes les tables (schéma et migrations
 * conservés), supprime les comptes Stripe Connect et les images Cloudinary
 * référencés en base. IRRÉVERSIBLE.
 *
 * Usage :
 * - Aperçu (aucune modification) : pnpm db:reset
 * - Exécution :                    pnpm db:reset --confirm
 *
 * Variables requises : DATABASE_URL, STRIPE_SECRET_KEY,
 * NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { Prisma, PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";

const prisma = new PrismaClient();
const confirmed = process.argv.includes("--confirm");

const CLOUDINARY_URL_REGEX = /https:\/\/res\.cloudinary\.com\/[^"\s\\]+/g;
// PaymentIntents encore annulables (fonds bloqués en capture manuelle inclus)
const CANCELABLE = [
	"requires_payment_method",
	"requires_confirmation",
	"requires_action",
	"requires_capture",
];

function publicIdFromUrl(url: string): string | null {
	const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^./]+$/);
	return match ? match[1] : null;
}

async function main() {
	for (const name of [
		"DATABASE_URL",
		"STRIPE_SECRET_KEY",
		"NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
		"CLOUDINARY_API_KEY",
		"CLOUDINARY_API_SECRET",
	]) {
		if (!process.env[name]) throw new Error(`Variable manquante : ${name}`);
	}

	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
		apiVersion: "2023-08-16",
	});
	cloudinary.config({
		cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
	});

	const tables = Prisma.dmmf.datamodel.models.map((m) => m.dbName ?? m.name);

	// 1. Collecte de ce qui doit être nettoyé hors base
	const [users, products, categories, proofs, payments] = await Promise.all([
		prisma.user.findMany({
			select: { image: true, stripeAccountId: true },
		}),
		prisma.product.findMany({ select: { imagesUrl: true } }),
		prisma.category.findMany({ select: { imageUrl: true } }),
		prisma.shippingProof.findMany({ select: { proofData: true } }),
		prisma.payment.findMany({ select: { stripePaymentIntentId: true } }),
	]);

	const stripeAccountIds = users.flatMap((u) =>
		u.stripeAccountId ? [u.stripeAccountId] : []
	);
	const urls = JSON.stringify([users, products, categories, proofs]).match(
		CLOUDINARY_URL_REGEX
	);
	const publicIds = [
		...new Set((urls ?? []).flatMap((url) => publicIdFromUrl(url) ?? [])),
	];

	console.log(`Base        : ${new URL(process.env.DATABASE_URL as string).host}`);
	console.log(
		`Stripe      : ${process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "LIVE" : "test"}`
	);
	console.log(`Tables      : ${tables.join(", ")}`);
	for (const table of tables) {
		const [{ count }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
			`SELECT COUNT(*) AS count FROM "${table}"`
		);
		console.log(`  ${table}: ${count}`);
	}
	console.log(`Comptes Stripe Connect à supprimer : ${stripeAccountIds.length}`);
	console.log(`PaymentIntents à vérifier/annuler  : ${payments.length}`);
	console.log(`Images Cloudinary à supprimer      : ${publicIds.length}`);

	if (!confirmed) {
		console.log("\nAperçu uniquement. Relancer avec --confirm pour exécuter.");
		return;
	}

	const failures: string[] = [];

	// 2. Stripe : annuler les paiements en cours, puis supprimer les comptes
	for (const { stripePaymentIntentId } of payments) {
		try {
			const intent = await stripe.paymentIntents.retrieve(
				stripePaymentIntentId
			);
			if (CANCELABLE.includes(intent.status)) {
				await stripe.paymentIntents.cancel(stripePaymentIntentId);
			}
		} catch (error) {
			failures.push(`PaymentIntent ${stripePaymentIntentId}: ${error}`);
		}
	}
	for (const accountId of stripeAccountIds) {
		try {
			await stripe.accounts.del(accountId);
		} catch (error) {
			failures.push(`Compte Stripe ${accountId}: ${error}`);
		}
	}

	// 3. Cloudinary (100 identifiants max par appel)
	for (let i = 0; i < publicIds.length; i += 100) {
		try {
			await cloudinary.api.delete_resources(publicIds.slice(i, i + 100));
		} catch (error) {
			failures.push(`Cloudinary (lot ${i / 100 + 1}): ${JSON.stringify(error)}`);
		}
	}

	// 4. Base de données
	await prisma.$executeRawUnsafe(
		`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`
	);
	console.log("\nBase vidée.");

	if (failures.length > 0) {
		console.log(`\n${failures.length} échec(s) hors base, à traiter à la main :`);
		failures.forEach((failure) => console.log(`- ${failure}`));
	}
}

main()
	.catch((error) => {
		console.error("Échec du reset :", error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
