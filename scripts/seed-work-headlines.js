// /work scene headlines (STAGING cluster) — logged in COPY_CHANGELOG.md.
//
// Two authored lines per story, rendered as the scene headline on /work: line one in the primary
// tier, line two in the muted italic beneath it. Idempotent — safe to re-run.
//
// House rules applied throughout. The design prototype these came from carried four quantified
// claims — "booking volume grew sixfold in five months", "297 legacy pages", "Forty spreadsheets",
// and "every pitch in Dhaka" — none of which appears in DECK_COPY.md or SOURCES.md, and the Turfly
// figures had already been stripped site-wide (see the Stories v2 entry in COPY_CHANGELOG). Every
// line below is count-free and grounded in the deck or the case-study sources.
//
// `holcim` is deliberately absent: COPY_CHANGELOG records that we have no source document for it,
// so it falls back to its own title rather than getting a headline we cannot support.
//
// Run: mongosh "mongodb+srv://…/ternary-local" --file scripts/seed-work-headlines.js

const now = new Date()

// slug → [line one, line two (muted italic)]
const HEADLINES = {
  // Deck p24: "unifying decision-critical workflows across pricing, inventory, and distribution";
  // "The lack of a unified control layer created yield leakage".
  'counterfoil-continuum': ['One control layer', 'for every revenue lever.'],

  // Deck p26: "fragmented manual processes, phone-based availability checks, and delayed
  // confirmations"; "The market needed instant booking confirmation".
  turfly: ['From phone calls and guesswork', 'to instant confirmation.'],

  // Deck p39: "air-gapped open-source LLM environment"; "avoid uncontrolled data exposure";
  // "control at the infrastructure boundary".
  'lankabangla-securities': ['An AI that never', 'leaves the building.'],

  // COPY_CHANGELOG (DSE entry): "disciplined legacy parity (four governing rules: no invented
  // pages, no lost information, no invented/derived data fields, verbatim table labels)".
  'dhaka-stock-exchange': ['A legacy platform rebuilt,', 'nothing lost in transit.'],

  // Deck p33: "fragmented workflows and inconsistent process enforcement"; "Manual handoffs and
  // disconnected practices"; "established a coherent ERP foundation".
  'farogl-odoo-erp': ['Spreadsheets and handoffs,', 'replaced by one governed system.'],

  // Deck p28: "purpose-built finger-grip hardware" (the sensor is in the grip, not on the ball —
  // the prototype had this the other way round); "a context-aware AI assistant that translates
  // data into coaching recommendations".
  'alley-analytix': ['A sensor in your grip,', 'a coach in the app.'],

  // Deck p35: "replace fragmented tools and manual processes"; "relying on slow paperwork";
  // "launched a unified, mobile digital platform".
  doyouwork: ['Paper, phone calls, and spreadsheets,', 'retired into one platform.'],
}

// Curated reel order, highest first. Taken from the design prototype's own sequence, with the two
// studies it did not include appended. Without a weight the reel falls back to creation date,
// which opened on `holcim` — the one study with no authored headline and no source document.
// Editors can change any of this in the admin sidebar; nothing here is load-bearing in code.
const WEIGHTS = {
  'counterfoil-continuum': 60,
  turfly: 50,
  'lankabangla-securities': 40,
  'dhaka-stock-exchange': 30,
  'farogl-odoo-erp': 20,
  'alley-analytix': 10,
  doyouwork: 5,
  holcim: 0,
}

let updated = 0
let missing = []

for (const [slug, lines] of Object.entries(HEADLINES)) {
  const value = lines.join('\n')
  const result = db.stories.updateOne(
    { slug },
    { $set: { 'workHeadline.en': value, updatedAt: now } },
  )
  if (result.matchedCount === 0) {
    missing.push(slug)
    continue
  }
  updated += result.modifiedCount

  // Keep the latest draft in step so a republish cannot resurrect an empty headline — the
  // seed-stories-v2 / seed-dse-story pattern. `_story_versions` needs getCollection(): mongosh
  // does not expose underscore-prefixed collections as properties on `db`.
  const versions = db.getCollection('_story_versions')
  const parent = db.stories.findOne({ slug })._id
  const latest = versions.find({ parent }).sort({ updatedAt: -1 }).limit(1).toArray()[0]
  if (latest) {
    versions.updateOne({ _id: latest._id }, { $set: { 'version.workHeadline.en': value } })
  }
}

let weighted = 0
for (const [slug, weight] of Object.entries(WEIGHTS)) {
  const result = db.stories.updateOne({ slug }, { $set: { sortWeight: weight, updatedAt: now } })
  if (result.matchedCount > 0) weighted += 1
}

print('workHeadline set on ' + updated + ' stor' + (updated === 1 ? 'y' : 'ies'))
print('sortWeight set on ' + weighted + ' stories')
if (missing.length) print('NOT FOUND (skipped): ' + missing.join(', '))
print('holcim intentionally left unset — no approved source material.')
