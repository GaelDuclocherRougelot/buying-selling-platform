/**
 * Trafic synthétique pour valider la chaîne PostHog de ZONE avant le lancement.
 *
 * Tous les événements portent `synthetic: true`, `source: "playwright"` et
 * `synthetic_run: <id>` : ils sont filtrables et ne doivent jamais être
 * présentés comme de vrais utilisateurs.
 *
 * Usage :
 *   BASE_URL=https://<preview>.vercel.app SESSIONS=40 pnpm synthetic
 *
 * Variables (ligne de commande, .env.local ou .env) :
 *   BASE_URL                 URL de preview Vercel (production refusée)
 *   SESSIONS                 nombre de sessions (défaut 40)
 *   TEST_USER_EMAIL / TEST_USER_PASSWORD   compte de test (étapes connectées)
 *   ALLOW_DB_WRITES=true     confirme que la base de la preview n'est PAS celle
 *                            de production. Sans cela : aucune connexion, aucun
 *                            favori, aucun checkout (le script ne fait que lire).
 *   ALLOW_STRIPE_PAYMENT=true  termine les paiements (carte 4242). À n'activer
 *                            que si les webhooks Stripe de test de ce compte ne
 *                            mènent pas à la base de production.
 *   PRODUCTION_URL           défaut https://buying-selling-platform.vercel.app
 *   VERCEL_AUTOMATION_BYPASS_SECRET  si la preview est protégée par Vercel
 *   HEADED=true              navigateur visible (headless: false)
 */
/// <reference types="node" />
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { gunzipSync } from 'zlib';
import { config } from 'dotenv';
import type { PostHog } from 'posthog-js';

// scripts/ n'est pas dans le tsconfig de l'app : on déclare ici window.posthog
// (exposé par src/components/analytics/PostHogProvider.tsx)
declare global {
  interface Window {
    posthog?: PostHog;
  }
}

// ---------- Configuration et garde-fous ----------

// Comme les autres scripts du projet : tsx ne charge pas les .env (seul Next.js
// le fait). Priorité : variables de la commande > .env.local > .env
config({ path: ['.env.local', '.env'], quiet: true });

const BASE_URL = (process.env.BASE_URL || '').replace(/\/$/, '');
const SESSIONS = Number(process.env.SESSIONS || 40);
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
const ALLOW_DB_WRITES = process.env.ALLOW_DB_WRITES === 'true';
const ALLOW_STRIPE_PAYMENT = process.env.ALLOW_STRIPE_PAYMENT === 'true';
const PRODUCTION_URL =
  process.env.PRODUCTION_URL || 'https://buying-selling-platform.vercel.app';
const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const HEADED = process.env.HEADED === 'true';
const RUN_ID = `run_${new Date().toISOString().replace(/[:.]/g, '-')}`;

function fail(message: string): never {
  console.error(`\n✋ ${message}\n`);
  process.exit(1);
}

if (!BASE_URL) fail('BASE_URL manquant (URL de preview Vercel).');
if (!Number.isInteger(SESSIONS) || SESSIONS < 1) fail('SESSIONS invalide.');

const baseHost = new URL(BASE_URL).host;
const prodHost = new URL(PRODUCTION_URL).host;
if (baseHost === prodHost) {
  fail(`BASE_URL pointe sur la production (${prodHost}). Utilise une URL de preview.`);
}
const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseHost);
if (!isLocal && !baseHost.endsWith('.vercel.app')) {
  fail(`BASE_URL (${baseHost}) n'est pas une preview Vercel (*.vercel.app) ni localhost.`);
}

// ---------- Parcours pondéré ----------

/** Étapes dans l'ordre du funnel. */
const STAGES = [
  'listing_viewed',
  'trust_score_opened',
  'favorite_added',
  'checkout_started',
  'purchase_completed',
] as const;
type Stage = (typeof STAGES)[number];

/** Part des sessions qui atteignent au moins chaque étape. */
const REACH: Record<Stage, number> = {
  listing_viewed: 1,
  trust_score_opened: 0.6,
  favorite_added: 0.3,
  checkout_started: 0.25,
  purchase_completed: 0.1,
};

function drawTargetStage(): Stage {
  const r = Math.random();
  for (const stage of [...STAGES].reverse()) if (r < REACH[stage]) return stage;
  return 'listing_viewed';
}

const wants = (target: Stage, stage: Stage) =>
  STAGES.indexOf(target) >= STAGES.indexOf(stage);

// ---------- Utilitaires navigateur ----------

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const pause = () => sleep(1000 + Math.random() * 3000); // 1 à 4 s

async function humanScroll(page: Page) {
  const steps = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, 200 + Math.random() * 500);
    await sleep(300 + Math.random() * 700);
  }
}

type Device = { label: string; viewport: { width: number; height: number }; mobile: boolean };
const DEVICES: Device[] = [
  { label: 'desktop-1920', viewport: { width: 1920, height: 1080 }, mobile: false },
  { label: 'desktop-1440', viewport: { width: 1440, height: 900 }, mobile: false },
  { label: 'desktop-1366', viewport: { width: 1366, height: 768 }, mobile: false },
  { label: 'mobile-390', viewport: { width: 390, height: 844 }, mobile: true },
  { label: 'mobile-412', viewport: { width: 412, height: 915 }, mobile: true },
];

/**
 * posthog-js ignore les navigateurs qu'il juge automatisés : user agent
 * « HeadlessChrome », navigator.webdriver, marque HeadlessChrome dans
 * navigator.userAgentData. On présente un Chrome standard (sans toucher à la
 * config PostHog de l'app) ; les événements restent marqués synthetic.
 */
function userAgent(chromeMajor: string, mobile: boolean) {
  return mobile
    ? `Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Mobile Safari/537.36`
    : `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Safari/537.36`;
}

async function newContext(browser: Browser, device: Device, standardUa: boolean) {
  const major = browser.version().split('.')[0];
  const ctx = await browser.newContext({
    viewport: device.viewport,
    isMobile: device.mobile,
    hasTouch: device.mobile,
    locale: 'fr-FR',
    ...(standardUa && { userAgent: userAgent(major, device.mobile) }),
  });
  if (standardUa) {
    // Chaîne et non fonction : tsx/esbuild injecte des helpers (__name)
    // inexistants dans la page, ce qui ferait échouer le script en silence.
    await ctx.addInitScript(`
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      (() => {
        const brands = [
          { brand: 'Chromium', version: '${major}' },
          { brand: 'Google Chrome', version: '${major}' },
        ];
        const mobile = ${device.mobile};
        const platform = mobile ? 'Android' : 'Windows';
        Object.defineProperty(navigator, 'userAgentData', {
          get: () => ({
            brands, mobile, platform,
            getHighEntropyValues: async () => ({ brands, mobile, platform }),
          }),
        });
      })();
    `);
  }

  // Ne jamais atteindre la production (ex. success_url Stripe = URL de prod)
  await ctx.route(`https://${prodHost}/**`, route => route.abort());

  // Protection Vercel : en-tête de contournement uniquement vers la preview
  if (BYPASS_SECRET) {
    await ctx.route(`${BASE_URL}/**`, route =>
      route.continue({
        headers: {
          ...route.request().headers(),
          'x-vercel-protection-bypass': BYPASS_SECRET,
          'x-vercel-set-bypass-cookie': 'true',
        },
      })
    );
  }

  // Marque les achats côté serveur (create-session → webhook → purchase_completed)
  await ctx.addCookies([
    { name: 'zone_synthetic', value: '1', url: BASE_URL, sameSite: 'Lax' },
  ]);
  return ctx;
}

/** Compte les événements effectivement acceptés par PostHog (via /ingest). */
function trackIngestion(page: Page, sent: Map<string, number>) {
  page.on('requestfinished', async req => {
    if (!/\/ingest\/(i\/v0\/)?e\//.test(req.url())) return;
    const res = await req.response();
    if (!res || res.status() !== 200) return;
    const body = req.postDataBuffer();
    if (!body) return;
    let text = '';
    try {
      text = gunzipSync(body).toString();
    } catch {
      text = body.toString();
    }
    for (const m of text.matchAll(/"event"\s*:\s*"([^"]+)"/g)) {
      sent.set(m[1], (sent.get(m[1]) || 0) + 1);
    }
  });
}

// ---------- Étapes ----------

/**
 * Ouvre l'accueil et attend posthog-js. En cas d'échec, explique pourquoi
 * (protection Vercel, clé PostHog absente sur la preview…) au lieu d'un timeout.
 */
async function openHomeWithPostHog(page: Page) {
  const ingest: string[] = [];
  const onRequest = (r: { url(): string }) => {
    if (r.url().includes('/ingest/')) ingest.push(r.url());
  };
  page.on('request', onRequest);
  const res = await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForFunction(() => Boolean(window.posthog?.__loaded), null, {
      timeout: 20000,
    });
  } catch {
    const finalUrl = new URL(page.url());
    const status = res?.status() ?? 0;
    const title = await page.title().catch(() => '');
    let reason: string;
    if (finalUrl.host !== baseHost || status === 401 || status === 403) {
      reason =
        `la preview est protégée par Vercel (HTTP ${status}, page « ${title} » sur ${finalUrl.host}).\n` +
        '   → Ajoute VERCEL_AUTOMATION_BYPASS_SECRET (Vercel → Settings → Deployment Protection →\n' +
        '     Protection Bypass for Automation), ou désactive la protection des previews.';
    } else if (status >= 400) {
      reason = `la page d'accueil répond HTTP ${status} (« ${title} »).`;
    } else if (ingest.length === 0) {
      reason =
        "posthog-js ne démarre pas : aucune requête vers /ingest.\n" +
        '   → Vérifie que NEXT_PUBLIC_POSTHOG_KEY est définie pour l\'environnement « Preview »\n' +
        '     sur Vercel (Settings → Environment Variables), puis redéploie la preview.';
    } else {
      reason =
        'posthog-js démarre mais window.posthog est absent : la preview est antérieure à\n' +
        '   la PR #9 (exposition de window.posthog). Utilise une preview plus récente.';
    }
    fail(`PostHog introuvable sur ${BASE_URL} : ${reason}`);
  } finally {
    page.off('request', onRequest);
  }
}

async function acceptCookiesAndTag(page: Page) {
  await openHomeWithPostHog(page);
  // Avant l'accord : le marquage s'applique dès l'événement $opt_in
  await page.evaluate(
    run => window.posthog!.register({ synthetic: true, source: 'playwright', synthetic_run: run }),
    RUN_ID
  );
  await pause();
  await page.getByRole('button', { name: 'Accepter', exact: true }).click();
  const ok = await page.evaluate(() => window.posthog!.has_opted_in_capturing());
  if (!ok) throw new Error("PostHog n'est pas passé en opt-in après « Accepter »");
}

async function openRandomListing(page: Page) {
  await humanScroll(page);
  const links = page.locator('a[href^="/products/"]');
  try {
    await links.first().waitFor({ timeout: 20000 });
  } catch {
    await explainMissingListings(page, await links.count());
  }
  const hrefs = [...new Set(await links.evaluateAll(as => as.map(a => a.getAttribute('href')!)))];
  const href = hrefs[Math.floor(Math.random() * hrefs.length)];
  await pause();
  await page.locator(`a[href="${href}"]`).first().click();
  await page.waitForURL(`**${href}`, { timeout: 20000 });
  await page.waitForLoadState('networkidle');
  await humanScroll(page);
  return href;
}

/**
 * Aucune annonce sur l'accueil : interroge l'API qui l'alimente pour donner la
 * cause et arrêter le script (toutes les sessions échoueraient de la même façon).
 */
async function explainMissingListings(page: Page, attached: number): Promise<never> {
  if (attached > 0) {
    fail(
      `${attached} lien(s) d'annonce présents mais invisibles à l'écran : vérifie la mise en page ` +
        `(viewport ${JSON.stringify(page.viewportSize())}).`
    );
  }
  const api = await page.evaluate(async () => {
    const res = await fetch('/api/products/featured');
    const text = await res.text();
    let count: number | null = null;
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) count = data.length;
    } catch {
      // réponse non JSON
    }
    return { status: res.status, count, text: text.slice(0, 200) };
  });
  if (api.status >= 400) {
    fail(
      `l'accueil n'affiche aucune annonce : /api/products/featured répond HTTP ${api.status}.\n` +
        `   Réponse : ${api.text}\n` +
        '   → Cause probable : la preview ne joint pas sa base. Vérifie DATABASE_URL pour\n' +
        "     l'environnement « Preview » sur Vercel, et les logs de la fonction dans Vercel."
    );
  }
  if (api.count === 0) {
    fail(
      "l'accueil n'affiche aucune annonce : la base de la preview ne contient aucune annonce\n" +
        '   au statut « active ». Publie au moins une annonce sur cette base (avec un compte\n' +
        '   vendeur différent du compte de test), puis relance.'
    );
  }
  fail(
    `/api/products/featured renvoie ${api.count ?? '?'} annonce(s) mais aucun lien n'apparaît ` +
      `sur l'accueil après 20 s. Réponse : ${api.text}`
  );
}

/** Retourne false si le badge Trust Score n'existe pas encore dans l'UI. */
async function openTrustScore(page: Page) {
  const badge = page.locator('[data-testid="trust-score-badge"]').first();
  if ((await badge.count()) === 0) return false;
  if (Math.random() < 0.5) {
    await badge.hover(); // trust_score_badge_hovered
    await pause();
  }
  await badge.click(); // trust_score_opened
  await pause();
  return true;
}

async function login(page: Page) {
  const back = page.url();
  // networkidle : le formulaire doit être hydraté, sinon le clic le soumet en
  // HTML classique (GET avec le mot de passe dans l'URL) et rien ne se passe
  await page.goto(BASE_URL + '/auth/login', { waitUntil: 'networkidle' });
  await page.locator('#email').fill(TEST_USER_EMAIL!);
  await page.locator('#password').fill(TEST_USER_PASSWORD!);
  await pause();
  const signIn = page.waitForResponse(r => r.url().includes('/api/auth/sign-in/'), {
    timeout: 20000,
  });
  await page.locator('button[type="submit"]').first().click();
  const res = await signIn;
  if (!res.ok()) {
    throw new Error(
      `connexion refusée (HTTP ${res.status()}) : vérifie TEST_USER_EMAIL / TEST_USER_PASSWORD`
    );
  }
  await page.waitForURL(u => !u.pathname.startsWith('/auth/login'), { timeout: 20000 });
  // La personne PostHog du compte de test est aussi marquée (après identify())
  await page
    .waitForFunction(() => window.posthog?.get_property('$user_state') === 'identified', null, {
      timeout: 15000,
    })
    .then(() => page.evaluate(() => window.posthog!.setPersonProperties({ synthetic: true })))
    .catch(() => undefined);
  await page.goto(back, { waitUntil: 'networkidle' });
}

/**
 * Ajoute en favori. Pas de retrait : l'API de suppression est cassée côté app
 * (userId manquant) ; les favoris du compte de test partent avec SEED_RESET=true.
 */
async function addFavorite(page: Page) {
  const add = page.getByRole('button', { name: 'Ajouter aux favoris' });
  if ((await add.count()) === 0) return false;
  await add.first().click();
  await page.getByRole('button', { name: 'Retirer des favoris' }).first().waitFor({ timeout: 10000 });
  await pause();
  return true;
}

type CheckoutResult = 'started' | 'live_keys' | 'unavailable';

async function startCheckout(page: Page): Promise<{ result: CheckoutResult; url?: string }> {
  const buy = page.getByRole('button', { name: /Acheter pour/ });
  if ((await buy.count()) === 0) return { result: 'unavailable' };
  const response = page.waitForResponse(r =>
    r.url().includes('/api/stripe/checkout/create-session')
  );
  await buy.first().click(); // checkout_started
  const res = await response;
  if (!res.ok()) return { result: 'unavailable' };
  const { url } = (await res.json()) as { url?: string };
  if (!url) return { result: 'unavailable' };
  // Clés de test Stripe : identifiant de session cs_test_…
  if (!url.includes('cs_test_')) {
    await page.goto('about:blank'); // ne jamais remplir une session live
    return { result: 'live_keys', url };
  }
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
  return { result: 'started', url };
}

async function payWithTestCard(page: Page) {
  const fillIfVisible = async (selector: string, value: string) => {
    const el = page.locator(selector);
    if (await el.isVisible().catch(() => false)) await el.fill(value);
  };
  await page.locator('#cardNumber').waitFor({ timeout: 30000 });
  await fillIfVisible('#email', TEST_USER_EMAIL!);
  await page.locator('#cardNumber').fill('4242 4242 4242 4242');
  await page.locator('#cardExpiry').fill('12 / 34');
  await page.locator('#cardCvc').fill('123');
  await fillIfVisible('#billingName', 'Synthetic Playwright');
  await fillIfVisible('#billingPostalCode', '75001');
  await pause();
  const success = page.waitForRequest(r => r.url().includes('payment=success'), {
    timeout: 60000,
  });
  await page.locator('button[type="submit"]').first().click();
  await success; // redirection vers success_url (bloquée si c'est la prod)
}

// ---------- Exécution ----------

type SessionReport = {
  target: Stage;
  reached: Stage | 'none';
  /** Étapes réellement franchies (le badge Trust Score peut manquer). */
  achieved: Set<Stage>;
  notes: string[];
};

async function probeBotFilter(browser: Browser) {
  console.log('🔎 Filtrage des navigateurs automatisés par posthog-js :');
  for (const standardUa of [false, true]) {
    const ctx = await newContext(browser, DEVICES[0], standardUa);
    const page = await ctx.newPage();
    await openHomeWithPostHog(page);
    const isBot = await page.evaluate(() => window.posthog!._is_bot());
    const ua = await page.evaluate(() => navigator.userAgent);
    console.log(
      `   ${standardUa ? 'Chrome standard ' : 'Playwright brut '} → bot=${isBot} (${ua.includes('HeadlessChrome') ? 'HeadlessChrome' : 'Chrome'})`
    );
    await ctx.close();
    if (standardUa && isBot) {
      fail('posthog-js considère encore le navigateur comme un bot : relance avec HEADED=true.');
    }
  }
}

async function runSession(browser: Browser, index: number, flags: { noPayment: boolean }) {
  const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
  let target = drawTargetStage();
  const report: SessionReport = { target, reached: 'none', achieved: new Set(), notes: [device.label] };
  const reach = (stage: Stage) => {
    report.reached = stage;
    report.achieved.add(stage);
  };
  const sent = new Map<string, number>();

  // Étapes connectées : seulement si la base de la preview est isolée
  const canWrite = ALLOW_DB_WRITES && TEST_USER_EMAIL && TEST_USER_PASSWORD;
  if (!canWrite && wants(target, 'favorite_added')) {
    report.notes.push('écriture désactivée → arrêt après Trust Score');
    target = 'trust_score_opened';
  }
  if (flags.noPayment && target === 'purchase_completed') {
    report.notes.push('paiement désactivé → arrêt au checkout');
    target = 'checkout_started';
  }

  const ctx: BrowserContext = await newContext(browser, device, true);
  const page = await ctx.newPage();
  trackIngestion(page, sent);

  let step = 'bandeau cookies';
  try {
    await acceptCookiesAndTag(page);
    step = 'ouverture annonce';
    await openRandomListing(page);
    reach('listing_viewed');

    if (wants(target, 'trust_score_opened')) {
      step = 'Trust Score';
      if (await openTrustScore(page)) reach('trust_score_opened');
      else report.notes.push('badge Trust Score absent');
    }
    if (wants(target, 'favorite_added')) {
      step = 'connexion';
      await login(page);
      step = 'favori';
      if (await addFavorite(page)) reach('favorite_added');
      else report.notes.push('déjà en favori');
    }
    if (wants(target, 'checkout_started')) {
      step = 'checkout';
      await pause();
      const { result } = await startCheckout(page);
      if (result === 'started') reach('checkout_started');
      else if (result === 'live_keys') {
        flags.noPayment = true;
        report.notes.push('⚠️ clés Stripe LIVE détectées : paiement annulé');
      } else report.notes.push('achat impossible sur cette annonce');
    }
    if (target === 'purchase_completed' && report.reached === 'checkout_started') {
      step = 'paiement Stripe';
      await payWithTestCard(page);
      reach('purchase_completed');
    }
  } catch (error) {
    report.notes.push(`erreur (${step}) : ${(error as Error).message.split('\n')[0]}`);
  } finally {
    await sleep(4000); // laisse posthog-js vider sa file d'envoi
    await ctx.close();
  }

  const events = [...sent].map(([e, n]) => `${e}×${n}`).join(' ');
  console.log(
    `#${String(index + 1).padStart(2, '0')} cible=${report.target} atteint=${report.reached} | ${report.notes.join(' · ')}\n    envoyés à PostHog : ${events || 'aucun'}`
  );
  return { report, sent };
}

async function main() {
  console.log(`🧪 Trafic synthétique ZONE — ${RUN_ID}`);
  console.log(`   cible : ${BASE_URL} · ${SESSIONS} sessions`);
  console.log(
    `   écritures en base : ${ALLOW_DB_WRITES ? 'autorisées (ALLOW_DB_WRITES)' : 'désactivées'} · paiement : ${ALLOW_STRIPE_PAYMENT ? 'autorisé (ALLOW_STRIPE_PAYMENT)' : 'désactivé'}\n`
  );
  if (ALLOW_DB_WRITES && (!TEST_USER_EMAIL || !TEST_USER_PASSWORD)) {
    console.warn('⚠️ TEST_USER_EMAIL / TEST_USER_PASSWORD manquants : étapes connectées ignorées.\n');
  }

  const browser = await chromium.launch({
    headless: !HEADED,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  await probeBotFilter(browser);
  console.log('');

  const flags = { noPayment: !ALLOW_STRIPE_PAYMENT };
  const reached = new Map<string, number>();
  const sentTotal = new Map<string, number>();
  let errors = 0;

  for (let i = 0; i < SESSIONS; i++) {
    const { report, sent } = await runSession(browser, i, flags);
    for (const stage of STAGES) {
      if (report.achieved.has(stage)) {
        reached.set(stage, (reached.get(stage) || 0) + 1);
      }
    }
    for (const [e, n] of sent) sentTotal.set(e, (sentTotal.get(e) || 0) + n);
    if (report.notes.some(n => n.startsWith('erreur'))) errors++;
  }
  await browser.close();

  console.log(`\n📊 ${SESSIONS} sessions (${RUN_ID}), ${errors} en erreur`);
  console.log('   Étapes réellement franchies (nombre de sessions) :');
  for (const stage of STAGES) {
    const n = reached.get(stage) || 0;
    console.log(`   ${stage.padEnd(20)} ${String(n).padStart(3)}  (${Math.round((100 * n) / SESSIONS)} %)`);
  }
  console.log('   Événements acceptés par PostHog (200) :');
  for (const [e, n] of [...sentTotal].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${e.padEnd(28)} ${n}`);
  }
  console.log(
    '   (purchase_completed est envoyé côté serveur par le webhook : à vérifier dans PostHog)'
  );
  if (flags.noPayment && ALLOW_STRIPE_PAYMENT) {
    console.log('\n⚠️ Clés Stripe LIVE sur la preview : aucun paiement effectué.');
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
