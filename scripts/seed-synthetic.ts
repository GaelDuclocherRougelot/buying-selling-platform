/**
 * Remplit une base de TEST (preview, branche Neon dédiée, base locale) avec des
 * données synthétiques pour scripts/synthetic-sessions.ts.
 *
 * Tout est identifiable et supprimable :
 * - utilisateurs : email @synthetic.zone.invalid ou username « synthetic_… »
 * - annonces : appartiennent aux vendeurs synthétiques, description marquée
 *
 * Usage :
 *   SEED_DATABASE_URL=postgresql://… SEED_CONFIRM=<hôte de la base> pnpm seed:synthetic
 *
 * Variables (ligne de commande, .env.local ou .env) :
 *   SEED_DATABASE_URL       base cible (jamais DATABASE_URL par défaut)
 *   SEED_CONFIRM            doit être égal à l'hôte de SEED_DATABASE_URL
 *   PRODUCTION_DATABASE_URL si défini, refuse toute base sur le même hôte
 *   TEST_USER_EMAIL / TEST_USER_PASSWORD  crée le compte acheteur de test
 *   SEED_STRIPE_ACCOUNT_ID  compte Stripe Connect de TEST (acct_…) donné au
 *                           vendeur principal, pour que le checkout fonctionne
 *   SEED_PRODUCTS           nombre d'annonces (défaut 40)
 *   SEED_RESET=true         supprime d'abord les données synthétiques existantes
 */
/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';

config({ path: ['.env.local', '.env'], quiet: true });

const SYNTHETIC_DOMAIN = 'synthetic.zone.invalid';
const SYNTHETIC_MARK = '[Donnée synthétique — scripts/seed-synthetic.ts]';

function fail(message: string): never {
  console.error(`\n✋ ${message}\n`);
  process.exit(1);
}

// ---------- Garde-fous ----------

const SEED_DATABASE_URL = process.env.SEED_DATABASE_URL;
if (!SEED_DATABASE_URL) {
  fail(
    'SEED_DATABASE_URL manquant : indique explicitement la base de TEST à remplir.\n' +
      '   (DATABASE_URL n\'est jamais utilisée par défaut pour éviter d\'écrire en production.)'
  );
}
const dbHost = new URL(SEED_DATABASE_URL).hostname;
const dbName = new URL(SEED_DATABASE_URL).pathname.slice(1);

if (process.env.PRODUCTION_DATABASE_URL) {
  const prodHost = new URL(process.env.PRODUCTION_DATABASE_URL).hostname;
  if (prodHost === dbHost) fail(`SEED_DATABASE_URL pointe sur l'hôte de production (${dbHost}).`);
}
if (process.env.SEED_CONFIRM !== dbHost) {
  fail(
    `Base cible : ${dbHost} / ${dbName}\n` +
      `   Vérifie que ce n'est PAS la base de production, puis relance avec SEED_CONFIRM=${dbHost}`
  );
}
if (SEED_DATABASE_URL === process.env.DATABASE_URL) {
  console.warn(
    '⚠️ SEED_DATABASE_URL est identique à DATABASE_URL de ton .env : assure-toi que ce n\'est pas la prod.\n'
  );
}

const PRODUCTS = Number(process.env.SEED_PRODUCTS || 40);
if (!Number.isInteger(PRODUCTS) || PRODUCTS < 1) fail('SEED_PRODUCTS invalide.');
const STRIPE_ACCOUNT = process.env.SEED_STRIPE_ACCOUNT_ID;
if (STRIPE_ACCOUNT && !STRIPE_ACCOUNT.startsWith('acct_')) {
  fail('SEED_STRIPE_ACCOUNT_ID doit être un identifiant de compte Connect (acct_…).');
}

const prisma = new PrismaClient({ datasourceUrl: SEED_DATABASE_URL });

// ---------- Données ----------

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const CATEGORIES = [
  {
    name: 'meubles',
    displayName: 'Meubles',
    image: unsplash('1555041469-a586c61ea9bc'),
    items: ['Table en chêne', 'Chaise scandinave', 'Commode vintage', 'Étagère murale', 'Fauteuil en velours'],
    price: [20, 400],
  },
  {
    name: 'electronique',
    displayName: 'Électronique',
    image: unsplash('1498049794561-7780e7231661'),
    items: ['Casque Bluetooth', 'Enceinte portable', 'Tablette 10 pouces', 'Liseuse', 'Console de jeux'],
    price: [15, 450],
  },
  {
    name: 'vetements',
    displayName: 'Vêtements',
    image: unsplash('1445205170230-053b83016050'),
    items: ['Veste en jean', 'Manteau en laine', 'Robe d\'été', 'Pull en cachemire', 'Baskets en cuir'],
    price: [5, 150],
  },
  {
    name: 'sport',
    displayName: 'Sport',
    image: unsplash('1517649763962-0c623066013b'),
    items: ['Vélo de ville', 'Raquette de tennis', 'Tapis de yoga', 'Haltères 2×5 kg', 'Skateboard'],
    price: [10, 350],
  },
  {
    name: 'livres',
    displayName: 'Livres',
    image: unsplash('1512820790803-83ca734da794'),
    items: ['Lot de romans policiers', 'Bande dessinée collector', 'Livre de cuisine', 'Encyclopédie illustrée'],
    price: [3, 60],
  },
  {
    name: 'maison',
    displayName: 'Maison & déco',
    image: unsplash('1484101403633-562f891dc89a'),
    items: ['Lampe de chevet', 'Miroir rond', 'Service à thé', 'Plaid en laine', 'Plante artificielle'],
    price: [5, 120],
  },
];

const CITIES = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 'Rennes', 'Strasbourg', 'Montpellier'];
const CONDITIONS = ['new', 'good', 'good', 'mid', 'damaged'];
const DELIVERIES = ['pickup', 'delivery', 'in-person'] as const;
const SELLERS = ['camille', 'lucas', 'ines', 'hugo', 'lea'];

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
const between = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

// ---------- Nettoyage ----------

async function syntheticUserIds() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: `@${SYNTHETIC_DOMAIN}` } },
        { username: { startsWith: 'synthetic_' } },
      ],
    },
    select: { id: true },
  });
  return users.map(u => u.id);
}

async function reset() {
  const userIds = await syntheticUserIds();
  if (userIds.length === 0) return 0;
  const products = await prisma.product.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const productIds = products.map(p => p.id);
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { productId: { in: productIds } },
        { buyerId: { in: userIds } },
        { sellerId: { in: userIds } },
      ],
    },
    select: { id: true },
  });
  const paymentIds = payments.map(p => p.id);

  // Relations sans cascade d'abord (paiements et suivis), le reste suit en cascade
  await prisma.$transaction([
    prisma.shipmentTracking.deleteMany({ where: { paymentId: { in: paymentIds } } }),
    prisma.shippingProof.deleteMany({ where: { paymentId: { in: paymentIds } } }),
    prisma.payment.deleteMany({ where: { id: { in: paymentIds } } }),
    prisma.product.deleteMany({ where: { id: { in: productIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);
  return userIds.length;
}

// ---------- Création ----------

async function createUser(opts: {
  email: string;
  username: string;
  name: string;
  password?: string;
  stripeAccountId?: string;
}) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      email: opts.email,
      emailVerified: true,
      name: opts.name,
      username: opts.username,
      displayUsername: opts.username,
      ...(opts.stripeAccountId && {
        stripeAccountId: opts.stripeAccountId,
        stripeAccountStatus: 'active',
      }),
      ...(opts.password && {
        // Compte « credential » au format better-auth (connexion email + mot de passe)
        accounts: {
          create: {
            id: randomUUID(),
            accountId: id,
            providerId: 'credential',
            password: await hashPassword(opts.password),
          },
        },
      }),
    },
  });
  return id;
}

async function main() {
  console.log(`🌱 Seed synthétique → ${dbHost} / ${dbName}`);

  if (process.env.SEED_RESET === 'true') {
    console.log(`   Suppression des données synthétiques existantes : ${await reset()} utilisateur(s)`);
  } else if ((await syntheticUserIds()).length > 0) {
    fail('Des données synthétiques existent déjà : relance avec SEED_RESET=true pour les remplacer.');
  }

  // Catégories : créées seulement si absentes (les existantes sont réutilisées)
  const categories = [];
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, displayName: c.displayName, imageUrl: c.image },
    });
    categories.push({ ...c, id: category.id });
  }

  // Vendeurs synthétiques (le premier reçoit le compte Stripe Connect de test)
  const sellerIds: string[] = [];
  for (const [i, first] of SELLERS.entries()) {
    sellerIds.push(
      await createUser({
        email: `${first}@${SYNTHETIC_DOMAIN}`,
        username: `synthetic_${first}`,
        name: `${first[0].toUpperCase()}${first.slice(1)} (synthétique)`,
        stripeAccountId: i === 0 ? STRIPE_ACCOUNT : undefined,
      })
    );
  }

  // Annonces : 60 % chez le vendeur Stripe si fourni, pour que le checkout aboutisse
  for (let i = 0; i < PRODUCTS; i++) {
    const c = pick(categories);
    const delivery = pick(DELIVERIES);
    const ownerId = STRIPE_ACCOUNT && Math.random() < 0.6 ? sellerIds[0] : pick(sellerIds);
    await prisma.product.create({
      data: {
        title: pick(c.items),
        description:
          `Annonce de démonstration en ${c.displayName.toLowerCase()}, bon rapport qualité-prix.\n\n` +
          SYNTHETIC_MARK,
        price: between(c.price[0], c.price[1]),
        condition: pick(CONDITIONS),
        imagesUrl: [c.image],
        categoryId: c.id,
        ownerId,
        status: 'active',
        city: pick(CITIES),
        delivery,
        deliveryPrice: delivery === 'delivery' ? between(3, 15) : 0,
      },
    });
  }

  // Compte acheteur de test pour pnpm synthetic
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (email && password) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`   Compte de test ${email} déjà présent : conservé tel quel.`);
    } else {
      await createUser({
        email,
        username: 'synthetic_buyer',
        name: 'Acheteur de test (synthétique)',
        password,
      });
      console.log(`   Compte de test créé : ${email}`);
    }
  } else {
    console.log('   TEST_USER_EMAIL / TEST_USER_PASSWORD absents : pas de compte acheteur créé.');
  }

  console.log(
    `✅ ${categories.length} catégories, ${SELLERS.length} vendeurs, ${PRODUCTS} annonces actives` +
      (STRIPE_ACCOUNT ? ` (vendeur Stripe : ${STRIPE_ACCOUNT})` : ' (aucun vendeur Stripe : checkout impossible)')
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
