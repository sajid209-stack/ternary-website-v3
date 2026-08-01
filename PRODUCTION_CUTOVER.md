# Production cutover runbook — ternary.solutions

How to take the redesign + full CMS build-out live on **ternary.solutions**. Prepared 2026-08-01.
Code is on PR **ternary-solutions/ternary-website-v3#128** (`redesign-v2-production-cutover` → `main`).

> **Which branch deploys the live site?** This repo has both `main` and a diverged **`production`**
> branch — `production` carries 2 commits `main` lacks (`#125`, `#127`) and vice-versa. Our work is
> based cleanly on `main`. **Confirm which branch ternary.solutions actually builds from before the
> final promote:**
> - If it deploys from **`main`** → merge PR #128, deploy. Done.
> - If it deploys from **`production`** → merge PR #128 to `main`, then reconcile `main` → `production`
>   (rebase/merge, preserving `#125`/`#127`), and deploy `production`. Test the merge on a preview first.

> **The golden fact:** going live is TWO independent things — **code** (merge the PR) and **content**
> (seed the *production* database). The production CMS is a **separate database** from the yh16
> staging Atlas cluster and has received **none** of our content changes. Deploy the code without
> seeding the content first and the new design renders against empty/old CMS data → broken pages.

---

## Who can do this
Whoever holds **production access** — the company MongoDB connection string, write access to the
production deploy. Claude on this machine has write access to the production repo
`ternary-solutions/ternary-website-v3` (PR #128 is proof) but does **NOT** have the production
database string and cannot seed it. That step is yours / Shadman's.

## Prerequisites
1. The **production** `DATABASE_URI` (self-hosted Mongo, host `54.254.242.76`, db `ternary`).
   Never commit it. Never point a seed at it without the steps below.
2. A local checkout of the PR branch: `git fetch origin && git checkout redesign-v2-production-cutover`.
3. `pnpm install`.

---

## The safe order (avoids any broken window)

**Seed the content FIRST (while old code is still live), THEN deploy the new code.**
The seed scripts define the new block types in *code* (this branch), so they write valid content the
moment they run. The currently-deployed OLD code simply ignores that new content (its hub routes are
still hardcoded), so nothing breaks while you seed. Once the content is in, deploying the new code
picks it up immediately.

### Step 1 — Back up the production DB
`mongodump` the production `ternary` database. This is your rollback.

### Step 2 — DRY-run every seed against production (writes nothing)
Every seed is DRY by default. Point them at production and confirm they find the right docs:

```bash
DATABASE_URI='<PROD_URI>' pnpm payload run scripts/<seed>.ts     # DRY — reads only
```

### Step 3 — APPLY the content seeds, in this order
Run each with `SEED_DRY=0`. **All use `disableTransaction`** — REQUIRED on the production replica set
or writes silently roll back. The authoritative, detailed content list is **`COPY_CHANGELOG.md` →
"⚠️ PRODUCTION FOLLOW-UPS"**; this is the operational order:

```bash
# --- globals / taxonomy / base content (master fix plan) ---
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-megamenu.ts      # mega-menu panels + drop "Software Platforms"
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-legal-content.ts
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-stage1.ts        # footer caps, meta descriptions
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-stage5.ts        # home layout
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-fix-hero.ts
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-stage6.ts        # content integrity (deletes Test docs)
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-stage6b.ts       # contact page
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-stage7.ts        # about restructure
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-stage8.ts        # solution detail pages

# --- the hub blocks (this redesign) ---
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-solutions-hub.ts
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-careers-hub.ts
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-nav-stories.ts   # Work/Stories nav dedupe (header+footer)
DATABASE_URI='<PROD>' SEED_DRY=0 pnpm payload run scripts/seed-remaining-hubs.ts # capabilities + industries + scales, one connection
```

> Re-run any seed's DRY form afterward, or read the doc back, to confirm `updatedAt` changed — if it
> didn't, the write rolled back (check `disableTransaction`). Cross-check against `COPY_CHANGELOG.md`
> that no PRODUCTION FOLLOW-UP was missed — that file is the source of truth for the content list.

### Step 4 — Merge PR #128 → deploy the code
Merge `redesign-v2-production-cutover` into `main` (then promote to `production` if that's the deploy
branch — see the note at the top). Let the production build run. The code already
version-bumps every `unstable_cache` key, so the fresh deploy reads the now-seeded data (no stale
cache). If production exposes `/next/revalidate?secret=<CRON_SECRET>`, hit it after deploy as a belt.

### Step 5 — Verify production (do NOT skip)
- **Media** — the biggest unknown. On yh16, `/api/media/file/...` 404s (staging storage gap). Confirm
  production actually serves media: open the home page and case-study/story thumbnails and check they
  load. If they 404, production's media storage (S3/local) needs the uploaded files — resolve before
  announcing.
- **Links** — spot-check nav, all five hubs, a capability/solution/industry/case-study detail, both
  `en` and `/bn`. (Staging showed 65/67 routes 200.)
- **Both locales** — `/bn` currently falls back to English for newly-CMS'd hub copy (Bengali not yet
  authored); confirm that's acceptable for launch or author the `bn` values first.

---

## Known issues to resolve at/before launch (both PRE-EXISTING, not from this work)
1. **Broken legal links** — the legal "working draft" pages contain `/legal` and
   `/legal/privacy-policy.pdf` (wrong paths) in their seeded CMS content. These pages are already
   flagged pending counsel review. Fix the link values in the `legal` docs, or finalize those pages.
2. **Homepage media on staging** — 12 images 404 on yh16 because the files aren't in yh16 storage.
   Likely staging-only (production has its own media store) — but **must be verified in Step 5**.

## Rollback
- **Code**: revert the merge commit on `main`, redeploy.
- **Content**: restore from the Step 1 `mongodump`. (Payload also keeps per-doc version history, but
  the dump is the clean full rollback.)
