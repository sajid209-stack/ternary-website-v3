import type { Field } from 'payload'

/**
 * Structured case-study fields appended to the `story` collection only (composed in
 * `story.ts`, NOT in the shared `makeContentCollection` factory). The story detail page
 * (`/case-studies/<slug>`) renders the main `content` rich text as the write-up; these two
 * fields drive only the hero chrome (hero chips + the meta strip) and both live in the admin
 * right sidebar so the edit view leads with title/content.
 *
 * Every leaf text field is `localized` (en + bn). The repeatable `tags` array is `localized`
 * too, so each locale keeps an independent chip list.
 */
export const caseStudyFields: Field[] = [
  // Hero chips — short technique/topic tags shown under the lead paragraph.
  {
    name: 'tags',
    label: 'Hero Tags',
    type: 'array',
    localized: true,
    admin: {
      position: 'sidebar',
      description: 'Short chips shown in the hero (e.g. “Event-driven architecture”).',
    },
    fields: [{ name: 'name', label: 'Label', type: 'text' }],
  },

  // Media showcase — product visuals rendered in the detail page's "In the product" band.
  // Images render as <img>; uploads with a video mimeType render as <video>. When empty the
  // page shows a clearly-labeled placeholder grid awaiting client-supplied assets.
  {
    name: 'gallery',
    label: 'Media Showcase',
    type: 'array',
    admin: {
      position: 'sidebar',
      description: 'Product visuals for the detail page. Images now; video uploads render as <video>.',
    },
    fields: [
      { name: 'media', label: 'Media', type: 'upload', relationTo: 'media' },
      { name: 'caption', label: 'Caption', type: 'text', localized: true },
    ],
  },

  // Numbered "how we worked" sequence rendered by <NumberedSteps> between the write-up and the
  // media showcase. Two rows minimum (a single step is not a sequence) and four maximum — the
  // component lays out at most three columns before wrapping, and the band reads as a summary,
  // not a project plan. The band is guarded on this array, so leaving it empty hides it entirely
  // and the page's section numbering closes up behind it.
  //
  // Row structure is shared across locales with localized leaves, matching the capability
  // collection's `howWeDoIt.items` — the same content shape this component already renders there.
  {
    name: 'steps',
    label: 'How We Worked',
    type: 'array',
    minRows: 2,
    maxRows: 4,
    admin: {
      description: 'Numbered steps (2–4) shown after the write-up. Keep the bodies a similar length so they align.',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', localized: true },
      { name: 'body', label: 'Body', type: 'textarea', localized: true },
    ],
  },

  // The two-line editorial headline for a story's scene on /work. Line one is set in the primary
  // text tier, line two in the muted italic beneath it — so the break is authored, not wrapped.
  // Falls back to the story title when unset, which is why /work needs no separate curation list.
  //
  // House rules apply here as everywhere: no counts, no metrics, nothing we cannot source.
  {
    name: 'workHeadline',
    label: 'Work Page Headline',
    type: 'textarea',
    localized: true,
    admin: {
      description: 'Two lines, one per row. Line 2 renders in the muted italic. No counts or metrics.',
      rows: 2,
    },
  },

  // 5-cell meta strip beneath the hero.
  {
    name: 'caseMeta',
    label: 'Case Meta',
    type: 'group',
    admin: { position: 'sidebar' },
    fields: [
      { name: 'industry', label: 'Industry', type: 'text', localized: true },
      { name: 'engagement', label: 'Engagement', type: 'text', localized: true },
      { name: 'duration', label: 'Duration', type: 'text', localized: true },
      { name: 'team', label: 'Team', type: 'text', localized: true },
      { name: 'year', label: 'Year', type: 'text', localized: true },
    ],
  },
]
