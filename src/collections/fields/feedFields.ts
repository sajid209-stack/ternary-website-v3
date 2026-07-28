import type { Field } from 'payload'

/**
 * Fields shared by every collection that appears in the `/stories` feed (story, insight,
 * pressRelease). Defined once so the three collections cannot drift: the index sorts and links
 * across all of them, and a field present on only two of the three would silently change an item's
 * position or destination depending on which collection it came from.
 *
 * All of these are index concerns. Nothing here is rendered on a detail page.
 */

/** Curated ordering + external-source linking. */
export const feedFields: Field[] = [
  {
    name: 'sortWeight',
    label: 'Sort Weight',
    type: 'number',
    defaultValue: 0,
    admin: {
      position: 'sidebar',
      description: 'Higher sorts earlier on /stories. Ties fall back to the published date.',
    },
  },
  {
    name: 'linkType',
    label: 'Link Type',
    type: 'radio',
    defaultValue: 'internal',
    options: [
      { label: 'This site', value: 'internal' },
      { label: 'External source', value: 'external' },
    ],
    admin: {
      position: 'sidebar',
      description: 'External items link offsite and show the source label instead of the category.',
    },
  },
  {
    name: 'externalUrl',
    label: 'External URL',
    type: 'text',
    admin: {
      position: 'sidebar',
      condition: (_data, siblingData) => siblingData?.linkType === 'external',
      description: 'Full URL including https://',
    },
  },
  {
    name: 'sourceLabel',
    label: 'Source Label',
    type: 'text',
    localized: true,
    admin: {
      position: 'sidebar',
      condition: (_data, siblingData) => siblingData?.linkType === 'external',
      description: 'Shown in place of the category, e.g. “Read it on Forbes”.',
    },
  },
  {
    // The feed thumbnail may be a video upload; a still poster keeps the row from rendering an
    // empty black box before the first frame decodes, and is the ONLY thing shown under
    // prefers-reduced-motion, where the video is never played.
    name: 'posterImage',
    label: 'Video Poster',
    type: 'upload',
    relationTo: 'media',
    admin: {
      position: 'sidebar',
      description: 'Still frame used when the thumbnail is a video. Ignored for image thumbnails.',
    },
  },
]

/**
 * `insight` and `pressRelease` already carry their own date (`publishedDate` / `releaseDate`);
 * `story` carried none at all, so its rows had no date to show. Appended for `story` only.
 */
export const feedPublishedDateField: Field = {
  name: 'publishedDate',
  label: 'Published Date',
  type: 'date',
  admin: {
    position: 'sidebar',
    date: { pickerAppearance: 'dayOnly' },
    description: 'Shown on the /stories row and used as the fallback sort.',
  },
}
