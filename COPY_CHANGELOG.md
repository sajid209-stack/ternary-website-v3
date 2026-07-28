# Copy changelog

CMS/content changes made on the **staging** cluster (`ternary-local` on Atlas). These do NOT touch
production — this file is the handover artifact for replicating approved changes to the production
CMS later.

## ⚠️ PRODUCTION FOLLOW-UPS (replicate to production CMS)
- **Header global → mega-menu panels** — Capabilities / Solutions / Industries need `panel` content
  (columns + items + featured) added, matching the redesigned `MegaMenuOverlay` schema. Production
  still has the old flat `subItems` (empty dropdowns on the new code). Content authored below; seeded
  to staging via `scripts/seed-megamenu.js`. Also: drop the duplicate **"Software Platforms"** industry
  in favour of **"Technology Platforms"** (handoff naming resolution).

---

## Changes

### Header nav — "Work" added (staging)
`globals.header.menu` via `scripts/seed-nav-work.js` (idempotent). **Prod follow-up: replicate.**
- **Old:** Capabilities · Solutions · Industries · Scales · Stories
- **New:** Capabilities · Solutions · Industries · Scales · **Work** · Stories
A plain `link` entry (en "Work" / bn "কাজ") pointing at `/work`, shaped like the existing Scales
row. Placed before Stories so the two content surfaces sit together and the portfolio reads first.
- Code (same pass): `getGlobals.ts` CACHE_VERSION `v4 → v5`. The menu was seeded outside a Next
  request, so no afterChange hook fired to bust the `header` tag — the file documents the bump as
  the deterministic fix for exactly this, and without it the nav renders the old five-item menu.


### /work scene headlines + reel order (staging)
Via `scripts/seed-work-headlines.js` (idempotent). **Prod follow-up: replicate.** New `/work`
page — the case-study reel, one study per viewport. Each story gains a two-line `workHeadline`
(line 2 renders in the muted italic); the description line reuses the already-approved
`excerpts`, so no new prose was written for it.

The design prototype these came from carried four quantified claims — "booking volume grew
sixfold in five months" (Turfly), "297 legacy pages" (DSE), "Forty spreadsheets" (FAROGL) and
"every pitch in Dhaka" — none of which appears in DECK_COPY.md or SOURCES.md, and the Turfly
figures had already been stripped site-wide in the Stories v2 pass. All four were rewritten
count-free before anything was seeded:
- `counterfoil-continuum` → "One control layer / for every revenue lever." (deck p24)
- `turfly` → "From phone calls and guesswork / to instant confirmation." (deck p26 — replaces
  the "sixfold in five months" line)
- `lankabangla-securities` → "An AI that never / leaves the building." (deck p39, air-gapped)
- `dhaka-stock-exchange` → "A legacy platform rebuilt, / nothing lost in transit." (replaces
  "297 legacy pages")
- `farogl-odoo-erp` → "Spreadsheets and handoffs, / replaced by one governed system." (replaces
  "Forty spreadsheets"; deck p33)
- `alley-analytix` → "A sensor in your grip, / a coach in the app." (deck p28 — the sensor is
  finger-grip hardware, not on the ball as the prototype had it)
- `doyouwork` → "Paper, phone calls, and spreadsheets, / retired into one platform." (deck p35)
- `holcim` — **deliberately unset.** No source document exists for it (see the Stories v2 entry),
  so its scene falls back to its own title rather than carrying a headline we cannot support.
- `sortWeight` seeded 60 → 0 across the eight published stories so the reel opens on Counterfoil.
  Without a weight the order fell back to creation date, which opened on holcim. Editable in the
  admin sidebar.


### Header global — mega-menu panels (staging)
`globals.header.menu[Capabilities|Solutions|Industries].panel`
- **Old:** `type: 'mega'` set, but no `panel` (only legacy `subItems`) → dropdowns rendered empty.
- **New:** authored `panel` with `eyebrow`, `heading`, `viewAll`, `featured`, and icon-less `columns`
  of items linking to the real detail routes (`/capabilities/*`, `/solutions/*`, `/industries/*`).
  Copy is count-free (base-3 marks stay on the pages). Seeded via `scripts/seed-megamenu.js`.

### Capability detail pages — "What this means to us" (staging)
`capabilities[8].whatThisMeansToUs` (heading + richText description + items)
- **Old:** empty → detail pages rendered hero-only.
- **New:** authored real per-discipline content for all 8 capabilities (no invented clients/metrics).
  Seeded via `scripts/seed-capability-content.js`. **Production follow-up:** replicate to prod CMS.

### Home industries section — 4 cards (staging)
`pages.home.layout[industriesSection].industries`
- **Old:** 4 refs but one was a deleted/dangling doc → only 3 cards rendered (centered in a 4-col grid).
- **New:** set 4 valid industries (Financial Services & Insurance, Health Care, Technology Platforms,
  Consumer Goods & Services); resolves the Software-vs-Technology Platforms dup. **Prod follow-up.**

### Story titles — tightened for 2-line cards (staging)
`stories[10].title` — compressed each title to ≤51 chars (pure compression, no new claims) so home
hero card titles complete within the 2-line clamp. e.g. "Counterfoil: From a Booking Monolith to an
Event-Driven Platform" → "Counterfoil: A Booking Monolith Goes Event-Driven". Via
`scripts/seed-story-titles.js`. **Prod follow-up.**

### Home solutions section — all 4 solutions (staging)
`pages.home.layout[solutionsSection].items` — had 3 refs, one dangling; now the 4 canonical
solutions in order (Product Development · Enterprise Transformation · Engineering Augmentation ·
Managed Systems). **Prod follow-up.**

### Home section headings — hub voice (staging)
- capabilitiesSection: "Capabilities" → "What we practice"
- industriesSection: "Domain expertise across every industry" → "We build where the stakes are specific"
- scalesSection: "The scales we serve." → "From founding teams to national institutions"
**Prod follow-up.**

### Round-2 fixes (staging) — titles / industries / de-invented capability copy
- `stories[10].title` → shortened again to ≤37 chars (2-line clamp never truncates).
- `pages.home.layout[industriesSection].industries` → 8 industries (two 4-up rows; excludes the
  software-platforms dup and Consumer Goods & Services).
- `capabilities[8].whatThisMeansToUs` → **REWRITTEN to verbatim approved hub copy** (the exact
  /capabilities body sentences + tags). Removes previously authored prose flagged as invented.
Via `scripts/seed-fixes-round2.js`. **Prod follow-up.**

### Capability "Selected work" — fake case studies removed (staging)
`capabilities[*].caseStudies.items` → cleared on all 8. The items were generic invented examples
("2025 · Retail" etc.) present in the production data — not real client work. The section is guarded
and now hides entirely. **Prod follow-up: clear these in prod too; re-populate only with real,
approved case studies.**

### Capability copy v3 — deck-grounded plain-language revision (staging)
All 8 capabilities: heroSection.description, whatThisMeansToUs (heading/description/items with
plain-language excerpts), howWeDoIt ("How we work", 3 steps). Grounded in the company deck
(audit/deck/DECK_COPY.md) + approved hub copy; story arc per page; NO metrics, NO client names.
Via `scripts/seed-copy-v3.js`. **Prod follow-up.**

### Audit copy fixes (staging) — marks, definitions, placeholders, de-counting
Via `scripts/seed-audit-fixes.js` (idempotent). **Prod follow-up: replicate all.**
- `models[frame|flow|orchestra].title.en` → **℠ → ™** ("Frame℠" → "Frame™", etc.; bn already ™).
- `models.orchestra.excerpts.en + content.en` → **REWRITTEN to canonical on-demand-senior-talent
  definition** (deck p18 + approved /solutions wording). The old multi-pod/multi-program copy
  belonged to no engagement model. Stale bn excerpt/content **unset** (fallback serves en).
- `pages.home.layout[processSection].description` — "four foundations" → "the foundations that help
  us deliver" (en + bn de-counted; the list has five items).
- `pages.contact.layout` — placeholder `ctaBlock` ("CTA" / "vfgdvdfvdfvdsfbsdfbbfbdfb" / "123"
  buttons) **removed**; placeholder office phone "+1 (800) 123-4567" cleared (guarded row hides).
- `industries.technology-platforms.excerpts.en` → "Product companies making the jump from one
  system to a real platform." (home industry card had no description).
- `globals.footer.industries` → **software-platforms ref pulled** (dup of Technology Platforms).
- `solutions.enterprise-transformation.excerpts.en` → "Replace what you have outgrown. We modernize
  the systems your business depends on — without stopping the business to do it." (was the
  "Modernize legacy systems and processes." stub; stale bn unset).
- `pages.stories.layout[storiesArchive].description` — "Eight engagements, every one delivered to
  production." → "Every engagement here shipped to production." (en + bn de-counted).
- NOTE `team` "Romjan Ali" has **no position** in the DB — deliberately not invented; the
  component now guards/hides an empty role line (code).
Code-side (same pass): /solutions ℠→™ + proof slot hides when empty; home "N+ Orchestrators"
counter removed; empty team-role guard; industries index "Advanced Manufacturing & Energy" →
"Advanced Manufacturing"; `engagements@ternary.com` → `info@ternary.solutions` (ContactForm block +
form error copy); careers Team-voices lines de-quoted (plain role descriptions, not testimonials).

### Round-3 (staging) — home industries dedupe, excerpt alignment, About heading + story arc
Via `scripts/seed-round3.js` (idempotent). **Prod follow-up: replicate all.**
- `pages.home.layout[industriesSection].industries` → **4 cards** (was 8): Banking & Capital
  Markets · Health Care · Technology Platforms · Advanced Manufacturing. Financial Services &
  Insurance read as a duplicate of Banking & Capital Markets on the home grid — Banking kept.
- `industries[*].excerpts.en` aligned to one plain sentence of similar length (deck-grounded):
  - `banking-capital-markets` → "Digital transformation and secure platforms for financial
    institutions." (deck p07 verbatim; dropped the dense "high-tempo, control-sensitive" tail)
  - `healthcare` → "Digital health platforms that pair intuitive experiences with enterprise-grade
    compliance." (was a 22-word run-on; grounded in the Flex5 case narrative)
  - `public-sector` → "Secure, compliant systems for government and mission-critical operations."
    (was much shorter than every sibling; grounded in deck p09 Government & Defense)
  - technology-platforms / advanced-manufacturing / financial-services-insurance /
    sports-entertainment / hospitality-travel / consumer-goods already fit — untouched.
- `pages.about` hero — **"Built in New York, shipped everywhere." → "An engineering institution,
  built for the long term."** (deck p02 identity phrase + long-term-stewardship voice; shipping
  wordplay dropped). Description reworded to match: now opens "Ternary builds digital systems…"
  so "engineering institution" isn't repeated back-to-back with the heading.
- `pages.about.layout` **reordered into a story arc**: hero → thesis → approach (principles) →
  proof of work → culture → leadership → funding story → closing CTA (funding story moved from
  slot 2 to slot 7). Funding-story link relabeled "Start a conversation" → **"Work with us"**
  (same `/contact` destination) so it no longer duplicates the adjacent CTA block's button.
- Latest `_pages_versions` drafts for **home and about** synced to the new layouts (seed-about-v2
  pattern) so a republish can't resurrect the old order/copy.
- Code (same pass): cache keys bumped — `pages_${path}_${locale}_v2` → `_v3`
  (`[...slug]/page.tsx`) and `pages_home_${locale}_v6` → `_v7` (`[locale]/page.tsx`) so the new
  CMS state surfaces on deploy.

### Stories v2 — Word-doc case-study narratives + de-invented meta (staging)
`stories[10]` via `scripts/seed-stories-v2.js`. Source: `audit/case-studies/SOURCES.md`
(extracted from the client's `COMPANY PROFILE_ TERNARY  (1).docx` — the approved source
writing). **Prod follow-up: run the same script against the production CMS once approved.**
- `content.en` **rewritten for all 10 stories** to carry the doc narratives, edited to house
  rules: story arc (context → The challenge → Our approach → What we built → The outcome),
  plain language, **all quantified achievements from the docs dropped** (MAU/GMV/uptime/%
  figures etc.), no invented facts, short sections instead of walls of text.
  - 8 stories map to docs: counterfoil-continuum, turfly, alley-analytix, flex5,
    farogl-odoo-erp, doyouwork, hissho-sushiops360, lankabangla-securities.
  - **No doc:** dhaka-stock-exchange (copy kept; third heading → "What we're designing"),
    holcim (copy kept; "Overview" → "The context"). Flagged for client to supply source
    material later.
- `excerpts.en` → one confident grounded sentence per story (fantasy.co pattern; 8 doc-mapped
  stories only — DSE/Holcim excerpts were already grounded and untouched).
- `title.en` corrections where the old title contradicted the docs:
  - "Counterfoil: Event-Driven Booking" → **"Counterfoil: AI Revenue Operations"** (the doc
    positions Continuum as an AI revenue operating layer, not a booking rebuild).
  - "AlleyIQ: Lab-Grade Bowling Analytics" → **"Alley Analytix: Bowling Intelligence"**
    ("AlleyIQ" was drift — the client/product is Alley Analytix / Project Pinpoint).
- `tags` (en+bn) → per-story chips grounded in each doc. **Old state was one duplicated
  4-chip set** ("Event-driven architecture / API-first services / Policy engine /
  Model-assisted recommendations") copy-pasted across all 10 stories — wrong for most.
- `caseMeta` → **de-invented.** Old state had identical placeholder meta on all 10 stories
  ("Technology / 14 months / 9 — eng, ML, design, ops / 2025–2026" — fabricated). Now:
  per-story `industry` + `engagement` grounded in each doc's Type/segment line
  (e.g. "Oil & gas / Frame — enterprise transformation"); `duration`/`team`/`year` cleared
  (empty slots don't render — an empty proof slot beats a vague one).
- Latest `_story_versions` draft synced per story so a republish can't resurrect old copy.
- **bn follow-up:** narrative content.bn still carries the previous drafts; needs a proper
  Bangla translation pass of the new en narratives (en fallback rules do not apply here since
  bn content exists).
- Schema (code, same pass): `story.gallery` array added (`media` upload + localized
  `caption`) — powers the new "In the product" media-showcase band on the detail page.
  Empty today for all stories → the page renders a labeled placeholder grid
  ("Product visuals — coming soon") until the client supplies product images/videos.
- Code (same pass): detail cache keys bumped `story_detail_${slug}_${locale}` → `_v2`,
  `story_related_${slug}_${locale}` → `_v2`.

### Card-copy alignment pass (staging) — uniform line bands per card group
Via `scripts/seed-align-copy.js` (idempotent). **Prod follow-up: replicate all.** Goal: within
every card group, all cards' text blocks land in the same rendered-line band so rows align
(user-reported: home capabilities descriptions wrapped 2 vs 3+ lines). Every edit is a pure
compression/recomposition of existing approved wording — no new claims, no metrics. Stale bn
for each rewritten field **unset** (fallback serves en), per the seed-audit-fixes pattern.
- **Home capabilities strip** → 77–92ch band (2 lines; was 77–249, two cards clamped mid-claim):
  - `capabilities.agentic-architecture.excerpts.en` — 249ch two-sentence paragraph →
    "Multi-agent systems that plan, act, and verify — accountable for what they do in
    production." (recomposed from its approved /capabilities hub row + its own v3 clause).
  - `capabilities.devops-automation.excerpts.en` — 184ch → "We make shipping boring. More
    releases, fewer incidents, and no two-a.m. surprises." (the approved hub row, verbatim).
  - `capabilities.cloud-transformation.excerpts.en` — "…platform operations…" → "…operations…"
    (98 → 89ch).
- **Home solutions cards** → 105–124ch band (3 lines at lg; was 105–144):
  - `solutions.product-development.excerpts.en` — "End-to-end product engineering from
    conception to scale. We design…" → "End-to-end product engineering — we design, build, and
    launch digital products that users love and businesses depend on." (144 → 120ch).
- **Home industries cards** → 67–82ch band (2 lines; was 67–111):
  - `industries.healthcare.excerpts.en` — "Digital health platforms…" → "Health platforms that
    pair intuitive experiences with enterprise-grade compliance." (90 → 82ch).
  - `industries.hospitality-travel.excerpts.en` — "Digital platforms that coordinate pricing,
    inventory, and distribution for operators in the experience economy." → "Pricing,
    inventory, and distribution — coordinated for the experience economy." (111 → 78ch).
- **Home scales cards** → 164–175ch band (3 lines; was 166–208):
  - `scales.public-sector.excerpts.en` — dropped the "and useful at the workflow boundary"
    tail (208 → 164ch).
- **Home engagement models** → 105–126ch band (3 lines; Frame™ sat a line short at 102ch):
  - `models.frame.excerpts.en` — "…Built for discrete projects with well-understood
    objectives." → "…Built for discrete projects with a clear finish line and well-understood
    objectives." (recomposed with its approved /solutions descriptor; 102 → 126ch).
- **Capability detail "How we work" 3-up rows** → each page's row now spans ≤10ch (was up to
  39ch, mixing 2- and 3-line columns). `capabilities[*].howWeDoIt.items[*].excerpt.en`
  compressed on: digital-experiences[1,2], artificial-intelligence[0,1], data-analytics[0,1,2],
  cloud-transformation[2], internet-of-things[2], platformization[0], agentic-architecture[1]
  (e.g. data-analytics[2] "We maintain what we build, so the numbers stay accurate as your
  business changes — long-term stewardship, not a handoff." → same minus the tail, 120 → 81ch).
- Code (same pass) — secondary alignment guards, following the HeroFeatured min-h pattern
  (reserve + clamp the same N lines; copy is budgeted to fit, the clamp only guards future
  CMS edits): home capability card `line-clamp-3 min-h-[3.9em]`; solution card
  `lg:line-clamp-3 lg:min-h-[3.45em]`; industry card `sm:line-clamp-2 sm:min-h-[2.86em]`;
  scale + engagement cards `lg:line-clamp-3 lg:min-h-[4.29em]`. Cache keys bumped so the
  seeded state surfaces on deploy: `pages_home_${locale}_v8 → _v9`,
  `capability_${slug}_${locale}_v5 → _v6`, `solution_${slug}_${locale}_v2 → _v3`,
  `solution_related → solution_related_v2`, `industry_${slug}_${locale}_v2 → _v3`.

### Content-enrichment pass (staging) — DSE source + story, capability proof, related work, insights
Sources: `audit/case-studies/SOURCES.md` (new **“Dhaka Stock Exchange (DSE)” section appended**,
extracted from the new Desktop synthesis file `Here's a synthesis of the DSE engag.txt`; internal
references — SOW number, ticket IDs, staging URL, data blockers — flagged as hold-from-public) +
the existing Word-doc sections + `audit/deck/DECK_COPY.md`. **Prod follow-up: replicate all.**
- **`stories.dhaka-stock-exchange` upgraded to the seed-stories-v2 narrative arc** via
  `scripts/seed-dse-story.js` (idempotent; latest `_story_versions` synced).
  - `content.en` — old proposal/design-prototyping copy → active-rebuild narrative (context →
    The challenge → Our approach → What we're building → The outcome): full rebuild of the
    exchange's public platform on a modern CMS-driven stack, disciplined legacy parity (four
    governing rules: no invented pages, no lost information, no invented/derived data fields,
    verbatim table labels), design language (navy identity; green/red reserved for market
    movement), spec suite, audit loop with reconciliation evidence. No internal references,
    no metrics.
  - `excerpts.en` → "Ternary is rebuilding the Dhaka Stock Exchange's public platform on a
    modern, content-managed stack — under a strict fidelity standard…" (was "designing a
    ground-up rebuild… investor portal" — superseded by the new source).
  - `tags` (en+bn) → Legacy replatform · CMS-driven platform · Design system · Regulated data
    fidelity (was Public platform / Bilingual & accessible / Investor portal / Content
    workflows — grounded in the old proposal framing).
  - `caseMeta.engagement` → "Full platform rebuild" (was "Platform design & prototyping").
  - **bn follow-up:** content.bn/excerpts.bn still carry the previous copy.
- **Capability proof sections filled with real case studies** — `capabilities[8].caseStudies`
  (sectionLabel "Proof" · heading "Work behind this practice" · one-line description · items
  with meta "Sector · Client", title, 1–2-sentence problem/approach/outcome) via
  `scripts/seed-proof-sections.js` (idempotent). All content strictly from SOURCES.md;
  **metricValue/metricLabel deliberately left empty** (no invented numbers). Mapping:
  agentic-architecture ← LankaBangla + Hissho · artificial-intelligence ← LankaBangla + Alley
  Analytix · data-analytics ← Alley Analytix + Counterfoil · cloud-transformation ← Hissho
  (Azure) + FAR Oil & Gas (AWS) [refined from the draft "DSE" mapping — DSE's source is a
  replatform story, not a cloud story] · platformization ← Counterfoil + Turfly ·
  digital-experiences ← DSE + Flex5 + DoYouWork · devops-automation ← Counterfoil + Turfly ·
  internet-of-things ← Alley Analytix.
- **Insights: two lesson-style editorial retellings created** (published, EN only) via
  `scripts/seed-insights-case-lessons.js` (idempotent; `_insight_versions` snapshot created):
  - INS-006 `lessons-from-an-air-gapped-llm-in-capital-markets` — **"The Model Is the Easy
    Part: Lessons from an Air-Gapped LLM in Capital Markets"** (LankaBangla pattern; distinct
    from the existing generic draft INS-002 "Air-Gapped AI for Regulated Industries" — this one
    is the engagement retelling).
  - INS-007 `unify-the-domain-before-you-automate-it` — **"Unify the Domain Before You
    Automate It: Lessons from an Event-Driven Replatform"** (Counterfoil Continuum).
  - **bn follow-up:** both need Bangla translations (en fallback serves meanwhile).
- Code (same pass):
  - Capability detail proof row: **"Result —" line now renders only when a real metric is
    authored** (was an unconditional "[metric]" placeholder); "Read the story" link keeps
    right alignment via `ml-auto`. Meta renders the real "Sector · Client".
  - New `src/components/relatedWork.tsx` — guarded "Related work" strip (published stories
    only, capability related-card styling, links to `/case-studies/<slug>`).
  - Solutions detail: related-work strip added (map: product-development ← turfly/alley/flex5 ·
    enterprise-transformation ← farogl/DSE · managed-systems ← counterfoil/hissho ·
    engineering-augmentation ← none → hidden). Draft stories (flex5, hissho) auto-hide until
    published.
  - Industries detail: related-work strip added (banking-capital-markets ← lankabangla/DSE ·
    sports-entertainment ← turfly/alley · hospitality-travel ← counterfoil · healthcare ←
    flex5 · consumer-goods ← hissho/doyouwork · advanced-manufacturing ← holcim ·
    technology-platforms ← counterfoil/turfly; others hidden). Section numbering stays
    gap-free either way.
  - Cache keys bumped past persisted entries: `capability_${slug}_${locale}_v6 → _v7`,
    `solution_${slug}_${locale}_v3 → _v4`, `industry_${slug}_${locale}_v3 → _v4`.
- `audit/case-studies/INSPIRATION.md` — appended 8 accenture.com layout takeaways (how case
  studies, insights, and services interleave on one page).

### Scales copy — plain-language rewrite for non-technical buyers (staging + code)
Rewrote the "Scales" copy so a non-technical business owner or enterprise buyer understands every
line: no jargon (ATO, security by architecture, re-architect, cloud-native, pod, cadence,
increment, workstream, definition of done, program of record, MVP, CTO), no metrics-as-boasts, no
invented facts. Kept Frame™/Flow™/Orchestra™, the month/team ranges, and the real proof client
names (Alley Analytix, Flex5, FAROGL, Hissho Sushi, Dhaka Stock Exchange). **Prod follow-up:
replicate the CMS `scales` edits below.**

- **Home scale cards** (CMS `scales` collection) via `scripts/seed-scales-copy.js` (idempotent;
  stale `title.bn`/`excerpts.bn` unset so the en fallback serves). `title.en` → short human
  promise (≤8 words); `excerpts.en` → one plain 12–16-word sentence, aligned length (83–98ch band,
  all 3 lines the same). old → new:
  - `startups-and-scale-ups` — title "One pod. Daily ship cadence." → "Turn your idea into a
    product that ships." · excerpt "From first product to scaling infrastructure — senior pods
    that turn vision into a launch-ready system, then re-architect it for growth without slowing
    the team down." → "For founders and early teams: we build your first product and grow it as
    you scale."
  - `mid-market-and-enterprise` — title "Programs measured in quarters, not sprints." →
    "Modernize what your business runs on." · excerpt "Modernizing the core and transforming
    operations — from legacy systems to cloud-native platforms, delivered with the governance and
    adoption that larger organizations require." → "For established companies: we replace the
    systems you have outgrown, without pausing the business."
  - `public-sector` — title "Cleared engineers. ATO-ready from kickoff." → "Built for the
    standards you must meet." · excerpt "Secure, compliant, accountable delivery for institutions
    that demand security by architecture and verifiable governance — controlled at the
    infrastructure boundary." → "For government and public bodies: we build secure systems and
    prove they meet every rule."
- **/scales page** (hardcoded, `src/app/(frontend)/[locale]/scales/page.tsx`) — rewrote in place;
  structure/proof/engagement-model names intact. Page is fully static (reads no cache key), so no
  `_v` bump. Notable edits (old → new):
  - metadata description "…from a startup's first MVP to a national institution." → "…from a
    startup's first product…"
  - Startups lede "Founders and early CTOs with more roadmap than team." → "Founders and early
    tech leaders with more roadmap than people to build it."; How "One senior pod, shipping
    daily…" → "One senior team, shipping every day — and you talk straight to the people writing
    the code."; Week one "Architecture decided. Environments live. First increment in review." →
    "The key decisions are made. Your setup is running. The first working piece is in review."
  - Mid-Market lede "CTOs and transformation leads replacing something that can't afford to
    pause." → "The leaders replacing a system the business cannot afford to switch off."; How
    "…coordinated workstreams, governance your board will recognize." → "Long, multi-team
    programs — run with the oversight and reporting your board will expect."; "multiple pods" →
    "several teams"; Week one "Current state mapped. Sequencing drafted…" → "Where you stand today
    is mapped. The order of work is planned. Risks are named out loud."
  - Government title "Mission timelines. Audit obligations. No surprises." → "Public deadlines.
    Audits. No surprises."; lede kept; How "Security and auditability designed in… for review
    boards…" → "Security and a full record built in from day one — documented for the people who
    must review it, not just developers."; Typical shape "procurement-dependent" → "sized to your
    procurement process"; Week one "Compliance requirements mapped…" → "The rules you must follow
    are mapped before a single line of code."
  - NEVER_MOVES: "The hiring bar" → "Who we hire"; "The code review standard" → "How closely we
    check the work"; "The definition of done" → "Our standard for finished work". SHAPED_TO_YOU:
    "Process weight and ceremony" → "How much process and formality"; "Governance and reporting
    cadence" → "How often we report to you"; "Documentation depth" → "How much documentation".
  - "The point": "governance, or reporting cadence" → "oversight, or reporting rhythm"; "size of
    the invoice" → "size of the bill"; "scales aren't silos" → "the scales aren't sealed off from
    each other". "The constant": "program of record" → "a long-term government program"; "No
    junior bench swapped in" → "No juniors quietly substituted in"; "one definition of done" →
    "one standard for calling it finished"; card titles "The hiring bar holds"/"The review
    standard holds" → "Who we hire holds"/"How we check the work holds".
