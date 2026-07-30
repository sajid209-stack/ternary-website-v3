// Careers page — approved prototype copy (STAGING cluster) — logged in COPY_CHANGELOG.md.
//
// Replaces the careers copy with the wording from the approved prototype. Idempotent: matches on
// the target values, so a second run reports "already set" and writes nothing.
//
// WHY THIS MATTERS MORE THAN A NORMAL COPY PASS. The old careers components each carried `||`
// fallbacks for every string — "More than just a workplace. A platform for impact.", "Genuine
// Connection" (twice), "Structured leveling & clear progression", and more. Those defaults were
// rendering as real page copy whenever a CMS field was empty: unapproved marketing text that
// appears in no changelog. The rebuilt components render nothing for an empty field, so this
// seed is what actually puts approved words on the page.
//
// EN ONLY. The prototype is English. `bn` is deliberately left untouched rather than machine
// translated — a wrong Bengali string is worse than a stale one, and every locale on this site is
// human-written. Bengali needs a translation pass before /bn/careers matches.
//
// Run: mongosh "mongodb+srv://…/ternary-local" --file scripts/seed-careers-copy.js

// Lexical paragraph, matching the shape Payload's richText already stores on this page.
function para(text) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          children: [{ type: 'text', version: 1, text, detail: 0, format: 0, mode: 'normal', style: '' }],
        },
      ],
    },
  }
}

const HERO_H = 'Build once.\nAnswer for it always.'
const HERO_D =
  'We hire engineers who want to answer for what they build — not hand it off. Own systems into production, stay close to the work, and grow inside an engineering institution built for the long term. New York and Dhaka, one standard.'

const WORK_D =
  'The reality of building and sustaining complex systems shapes our culture — less noise, close proximity to users, a clear orientation toward impact.'
const WORK_ITEMS = [
  ['Ownership and stewardship', 'We take responsibility for the systems we design, deliver, and operate. Engineering here is long-term stewardship — care for reliability, maintainability, and the consequences of decisions over time.'],
  ['Transparent, low-noise execution', 'Direct communication and visible progress. Problems are surfaced early, trade-offs made explicit, and execution stays focused on outcomes rather than noise.'],
  ['Proximity to users and impact', 'We stay close to the people and operations our systems serve. Proximity to real workflows helps us build with context and deliver work that lasts.'],
  ['Built as stewards, not just builders', 'We see ourselves as custodians, accountable for building systems that run reliably, evolve thoughtfully, and serve the organizations that depend on them.'],
  ['A centralized institution', 'A unified center of engineering excellence creates operational continuity, preserves institutional knowledge, and gives every engineer a common standard to grow against.'],
]

const EXPECT_D =
  'We invest in the foundational systems of durable engineering excellence, so you can do the best work of your career.'
const EXPECT_ITEMS = [
  ['Real mentorship', 'Structured mentorship and experienced technical leadership, with clear expectations around accountability, code quality, and professional growth.'],
  ['Meaningful work', 'Production systems for organizations that depend on them — capital markets to digital health to field service. Not throwaway prototypes.'],
  ['A clear path forward', 'Career progression frameworks and leadership development, from associate engineer to technical lead and beyond.'],
]

const GROWTH_D =
  'We grow engineers along a clear progression, pairing increasing technical depth with expanding ownership and delivery responsibility.'
const GROWTH_LEVELS = ['Associate', 'Engineer', 'Senior', 'Lead']
const GROWTH_ITEMS = [
  ['Modern stack', 'Python, JavaScript, Java, and Go on the backend; React, Angular, Vue on the frontend; Flutter, Swift, Kotlin on mobile.'],
  ['Full-lifecycle experience', 'Strategy, design, build, launch, and operate — so you understand systems end to end, not just one slice.'],
  ['Global delivery hub', 'Grow inside our Dhaka delivery hub, the core engineering capability for the organizations we support worldwide.'],
]

// The prototype's voices copy carried its own bracketed note to swap in real engineers. That note
// is not copy and is not seeded; the quotes come from each team member's own CMS excerpt.
const VOICES_D = 'The engineers who deliver the technical infrastructure behind the modern enterprise.'

const ROLES_D =
  "We hire across engineering, design, and operations in New York and Dhaka. If you want production responsibility and a real path to grow, we want to hear from you — even when the exact role isn't listed."

const page = db.pages.findOne({ slug: 'careers' })
if (!page) throw new Error('careers page not found')

const layout = page.layout || []
const at = (type) => layout.findIndex((b) => b.blockType === type)
let changed = 0

function setHeading(i, value) {
  if (i === -1) return
  const cur = layout[i].heading
  const en = cur && typeof cur === 'object' ? cur.en : cur
  if (en === value) return
  layout[i].heading = Object.assign({}, typeof cur === 'object' ? cur : {}, { en: value })
  changed++
}

function setDesc(i, text) {
  if (i === -1) return
  const cur = layout[i].description
  const en = cur && cur.en && cur.en.root && cur.en.root.children[0] && cur.en.root.children[0].children[0]
  if (en && en.text === text) return
  layout[i].description = Object.assign({}, cur && typeof cur === 'object' ? cur : {}, { en: para(text).root ? para(text) : para(text) })
  changed++
}

function setCards(i, pairs) {
  if (i === -1) return
  const items = pairs.map(function (pair, n) {
    const existing = (layout[i].items || [])[n] || {}
    return Object.assign({}, existing, {
      title: Object.assign({}, typeof existing.title === 'object' ? existing.title : {}, { en: pair[0] }),
      excerpt: Object.assign({}, typeof existing.excerpt === 'object' ? existing.excerpt : {}, { en: pair[1] }),
    })
  })
  if (JSON.stringify(layout[i].items) === JSON.stringify(items)) return
  layout[i].items = items
  changed++
}

const iHero = at('careersHero')
const iWork = at('careersGridOne')
const iExpect = at('careersGridTwo')
const iGrowth = at('careersGrowth')
const iVoices = at('careersTeam')
const iRoles = at('jobsBlock')

setHeading(iHero, HERO_H)
setDesc(iHero, HERO_D)
setDesc(iWork, WORK_D)
setCards(iWork, WORK_ITEMS)
setDesc(iExpect, EXPECT_D)
setCards(iExpect, EXPECT_ITEMS)
setDesc(iGrowth, GROWTH_D)
setCards(iGrowth, GROWTH_ITEMS)
setDesc(iVoices, VOICES_D)
setDesc(iRoles, ROLES_D)

// Growth ladder rungs live on featured.levels (a tags array, max 4).
if (iGrowth !== -1) {
  const featured = layout[iGrowth].featured || {}
  const levels = GROWTH_LEVELS.map(function (name, n) {
    const existing = (featured.levels || [])[n] || {}
    return Object.assign({}, existing, {
      name: Object.assign({}, typeof existing.name === 'object' ? existing.name : {}, { en: name }),
    })
  })
  if (JSON.stringify(featured.levels) !== JSON.stringify(levels)) {
    featured.levels = levels
    layout[iGrowth].featured = featured
    changed++
  }
}

if (changed) {
  db.pages.updateOne({ _id: page._id }, { $set: { layout: layout } })
  print('careers copy updated — ' + changed + ' field group(s) written.')
} else {
  print('already set — no write needed.')
}
