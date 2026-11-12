/**
 * Remplit une base de TEST (preview, branche Neon dédiée, base locale) avec des
 * données synthétiques pour scripts/synthetic-sessions.ts.
 *
 * Tout est identifiable et supprimable :
 * - utilisateurs : email @synthetic.zone.invalid ou username « synthetic_… »
 * - annonces : appartiennent aux vendeurs synthétiques, description marquée
 * - catégories créées par le seed : image marquée « zone_seed=1 »
 *
 * Toutes les annonces sont des objets de 5 kg maximum (poids indiqué dans la
 * description).
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
 *   SEED_RESET=true         supprime d'abord les données synthétiques existantes,
 *                           puis recrée tout
 *   SEED_DELETE=true        supprime les données synthétiques et s'arrête
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

/** Poids maximal d'un objet mis en vente (kg). */
const MAX_WEIGHT_KG = 5;

// zone_seed=1 marque les catégories créées par ce script (supprimées au reset)
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop&zone_seed=1`;

/** Images des catégories créées par les versions précédentes du seed (sans marqueur). */
const LEGACY_SEED_IMAGES = [
  '1555041469-a586c61ea9bc',
  '1498049794561-7780e7231661',
  '1445205170230-053b83016050',
  '1517649763962-0c623066013b',
  '1512820790803-83ca734da794',
  '1484101403633-562f891dc89a',
].map(id => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`);

type Item = { title: string; kg: number };

const CATEGORIES: {
  name: string;
  displayName: string;
  image: string;
  price: [number, number];
  items: Item[];
}[] = [
  {
    name: 'electronique',
    displayName: 'Électronique',
    image: unsplash('1498049794561-7780e7231661'),
    price: [15, 350],
    items: [
      { title: 'Casque Bluetooth', kg: 0.3 },
      { title: 'Enceinte portable', kg: 0.6 },
      { title: 'Tablette 10 pouces', kg: 0.5 },
      { title: 'Liseuse', kg: 0.2 },
      { title: 'Console de jeux portable', kg: 0.4 },
      { title: 'Appareil photo compact', kg: 0.3 },
    ],
  },
  {
    name: 'vetements',
    displayName: 'Vêtements',
    image: unsplash('1445205170230-053b83016050'),
    price: [5, 150],
    items: [
      { title: 'Veste en jean', kg: 0.8 },
      { title: 'Manteau en laine', kg: 1.5 },
      { title: "Robe d'été", kg: 0.3 },
      { title: 'Pull en cachemire', kg: 0.4 },
      { title: 'Baskets en cuir', kg: 1 },
    ],
  },
  {
    name: 'accessoires',
    displayName: 'Accessoires',
    image: unsplash('1523275335684-37898b6baf30'),
    price: [5, 200],
    items: [
      { title: 'Sac à main en cuir', kg: 0.9 },
      { title: 'Montre vintage', kg: 0.1 },
      { title: 'Lunettes de soleil', kg: 0.05 },
      { title: 'Portefeuille', kg: 0.2 },
      { title: 'Écharpe en soie', kg: 0.1 },
    ],
  },
  {
    name: 'livres',
    displayName: 'Livres',
    image: unsplash('1512820790803-83ca734da794'),
    price: [3, 60],
    items: [
      { title: 'Lot de 5 romans policiers', kg: 1.8 },
      { title: 'Bande dessinée collector', kg: 0.6 },
      { title: 'Livre de cuisine', kg: 1.2 },
      { title: 'Encyclopédie illustrée', kg: 3 },
    ],
  },
  {
    name: 'jeux-jouets',
    displayName: 'Jeux & jouets',
    image: unsplash('1611996575749-79a3a250f948'),
    price: [5, 80],
    items: [
      { title: 'Jeu de société', kg: 1.2 },
      { title: 'Puzzle 1000 pièces', kg: 0.8 },
      { title: 'Peluche', kg: 0.4 },
      { title: 'Jeu de construction', kg: 1.5 },
    ],
  },
  {
    name: 'maison',
    displayName: 'Maison & déco',
    image: unsplash('1484101403633-562f891dc89a'),
    price: [5, 120],
    items: [
      { title: 'Lampe de chevet', kg: 1.2 },
      { title: 'Miroir rond', kg: 2.5 },
      { title: 'Service à thé', kg: 2 },
      { title: 'Plaid en laine', kg: 1 },
      { title: 'Vase en céramique', kg: 1.5 },
    ],
  },
  {
    name: 'sport',
    displayName: 'Sport',
    image: unsplash('1517649763962-0c623066013b'),
    price: [8, 120],
    items: [
      { title: 'Raquette de tennis', kg: 0.3 },
      { title: 'Tapis de yoga', kg: 1.5 },
      { title: 'Haltères 2 × 2 kg', kg: 4 },
      { title: 'Ballon de football', kg: 0.45 },
      { title: 'Gourde isotherme', kg: 0.4 },
    ],
  },
];

const tooHeavy = CATEGORIES.flatMap(c => c.items).filter(i => i.kg > MAX_WEIGHT_KG);
if (tooHeavy.length > 0) {
  fail(`Objets de plus de ${MAX_WEIGHT_KG} kg : ${tooHeavy.map(i => i.title).join(', ')}`);
}

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

  // Catégories créées par le seed, si plus aucune annonce ne les utilise
  const { count: categories } = await prisma.category.deleteMany({
    where: {
      OR: [
        { imageUrl: { contains: 'zone_seed=1' } },
        { imageUrl: { in: LEGACY_SEED_IMAGES } },
      ],
      products: { none: {} },
    },
  });
  return { users: userIds.length, products: productIds.length, categories };
}

/** Prévient si une image de catégorie ne s'affichera pas (identifiant Unsplash invalide). */
async function checkImages() {
  for (const c of CATEGORIES) {
    try {
      const res = await fetch(c.image, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
      if (!res.ok) console.warn(`⚠️ Image de « ${c.displayName} » introuvable (HTTP ${res.status}) : ${c.image}`);
    } catch {
      console.warn(`⚠️ Image de « ${c.displayName} » non vérifiable (réseau) : ${c.image}`);
    }
  }
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

  if (process.env.SEED_DELETE === 'true' || process.env.SEED_RESET === 'true') {
    const r = await reset();
    console.log(
      `   Supprimé : ${r.users} utilisateur(s), ${r.products} annonce(s), ${r.categories} catégorie(s)` +
        ' (favoris, conversations, sessions et paiements associés inclus)'
    );
    if (process.env.SEED_DELETE === 'true') {
      console.log('✅ Données synthétiques supprimées.');
      return;
    }
  } else if ((await syntheticUserIds()).length > 0) {
    fail('Des données synthétiques existent déjà : relance avec SEED_RESET=true pour les remplacer.');
  }

  await checkImages();

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
    const item = pick(c.items);
    const delivery = pick(DELIVERIES);
    const ownerId = STRIPE_ACCOUNT && Math.random() < 0.6 ? sellerIds[0] : pick(sellerIds);
    await prisma.product.create({
      data: {
        title: item.title,
        description:
          `Annonce de démonstration en ${c.displayName.toLowerCase()}, bon rapport qualité-prix.\n` +
          `Poids : ${item.kg.toLocaleString('fr-FR')} kg.\n\n` +
          SYNTHETIC_MARK,
        price: between(c.price[0], c.price[1]),
        condition: pick(CONDITIONS),
        imagesUrl: [c.image],
        categoryId: c.id,
        ownerId,
        status: 'active',
        city: pick(CITIES),
        delivery,
        // Frais de port selon le poids (≤ 5 kg)
        deliveryPrice: delivery === 'delivery' ? (item.kg <= 1 ? between(3, 6) : between(7, 12)) : 0,
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
    `✅ ${categories.length} catégories, ${SELLERS.length} vendeurs, ${PRODUCTS} annonces actives (≤ ${MAX_WEIGHT_KG} kg)` +
      (STRIPE_ACCOUNT ? ` (vendeur Stripe : ${STRIPE_ACCOUNT})` : ' (aucun vendeur Stripe : checkout impossible)')
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
