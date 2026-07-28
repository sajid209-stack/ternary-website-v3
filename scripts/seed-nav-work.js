// Header nav — add "Work" (STAGING cluster) — logged in COPY_CHANGELOG.md.
//
// The nav lives in the `header` global, not in code, so this is a content change. Idempotent:
// re-running matches on the existing entry and leaves the menu length unchanged.
//
// Placement: immediately before "Stories", so the two content surfaces sit together and the
// portfolio reads first. Shaped exactly like the existing "Scales" entry — a plain `link` item
// carrying an empty `panel`, which is what the header component expects for non-mega items.
//
// bn: "কাজ" (work). Set so Bangla visitors do not get an English label in an otherwise
// translated nav — every sibling item carries both locales.
//
// Run: mongosh "mongodb+srv://…/ternary-local" --file scripts/seed-nav-work.js

// `id` is not optional: Payload gives every array row an ObjectId, and a row written without one
// is dropped on read — the entry sits in the database but never reaches the rendered nav.
const WORK_ITEM = {
  label: { en: 'Work', bn: 'কাজ' },
  type: 'link',
  link: '/work',
  panel: { featured: { enabled: false }, columns: [], resources: [] },
}

const header = db.globals.findOne({ globalType: 'header' })
if (!header) {
  print('ERROR: no header global found — nothing changed.')
  quit(1)
}

const menu = header.menu || []
const existing = menu.findIndex((m) => m && m.link === '/work')

if (existing !== -1) {
  // Already present: refresh it in place rather than appending a duplicate.
  // Keep whatever id the row already has; mint one only if it somehow lacks it.
  const keepId = menu[existing].id || new ObjectId()
  menu[existing] = Object.assign({}, menu[existing], WORK_ITEM, { id: keepId })
  print('“Work” already in the nav at index ' + existing + ' — refreshed in place.')
} else {
  const before = menu.findIndex((m) => m && m.link === '/stories')
  const at = before === -1 ? menu.length : before
  menu.splice(at, 0, Object.assign({}, WORK_ITEM, { id: new ObjectId() }))
  print('“Work” inserted at index ' + at + '.')
}

db.globals.updateOne({ globalType: 'header' }, { $set: { menu, updatedAt: new Date() } })

print('nav is now: ' + menu.map((m) => (m.label && m.label.en) || '?').join(' · '))
