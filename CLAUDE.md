# CLAUDE.md

## Projet : ZONE (plateforme d'achat/vente entre particuliers)

Réponses en français, courtes et concises.

### Stack
- Next.js (App Router) + TypeScript, React 18, Tailwind 4, shadcn/ui (Radix)
- pnpm (versions de sécurité forcées via `overrides` dans `pnpm-workspace.yaml` ; Next réellement installé = 16.x malgré `package.json`)
- Prisma + PostgreSQL (Neon), better-auth (plugin username, rôles `admin` / `moderator`)
- Stripe Checkout + Connect (capture manuelle, fonds bloqués jusqu'à validation), Cloudinary, Resend
- PostHog (EU) pour l'analytics ; déploiement Vercel (`main` = production)

### Commandes
- `pnpm dev` · `pnpm lint` (eslint src) · `pnpm test` (Jest) · `pnpm build`
- `npx prisma generate` avant `tsc` si les types Prisma manquent
- Le build exige les secrets (Resend, Stripe, DB) : utiliser des valeurs factices hors `.env.local`

### Arborescence
- `src/app` pages et routes API (`src/app/api/**/route.ts`, doc Swagger en JSDoc)
- `src/components`, `src/features` (UI par domaine), `src/services` (accès données), `src/lib` (auth, api, analytics, consent, security-log…)
- `src/__tests__` tests Jest · `prisma/schema.prisma` · `docs/` (docs métier + typedoc) · `siem/` (Wazuh)

### Règles du projet
- **Base de données** : demander avant toute modification du schéma Prisma.
- **Suppression de code** : demander avant de supprimer du code existant.
- **Style** : suivre le style du fichier modifié (beaucoup de fichiers en tabulations malgré `.prettierrc`).
- **Appels API côté client** : passer par `apiFetch` (`src/lib/api.ts`), qui utilise l'origine courante dans le navigateur (CSP `connect-src 'self'`, previews Vercel).
- **CSP** : définie dans `src/middleware.ts`, avec nonce transmis dans les en-têtes de la *requête*. Le layout racine force le rendu dynamique (`await connection()`) : ne pas le retirer. Tout nouveau domaine externe doit être ajouté à la CSP.
- **Sécurité** : vérifier auth + propriété (ou rôle staff) dans chaque route qui modifie une ressource ; journaliser les refus avec `securityLog()` (lu par le SIEM, fichier `logs/security.json`).
- **Analytics (CNIL)** :
  - événements typés uniquement dans `src/lib/analytics.ts` (une fonction par événement) ;
  - jamais de donnée personnelle (email, nom, contenu de message) ; `identify()` avec l'id seulement ;
  - PostHog est en opt-out tant que l'utilisateur n'a pas accepté (`src/lib/consent.ts`, cookie `zone_analytics_consent`) ;
  - côté serveur (`posthog-node`), n'envoyer que si le consentement est connu et accordé, puis `await shutdown()` ;
  - classe `ph-no-capture` sur toute zone sensible (messagerie, paiement).
- **Secrets** : aucun secret côté client ; seules les clés publiques en `NEXT_PUBLIC_*`. Nouvelles variables → `.env.example`.
- **Git** : ne jamais committer d'images, de captures ou de rapports d'audit. Vercel déploie `main` : passer par une PR et vérifier la preview avant de merger.

---

## Bonnes pratiques

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
