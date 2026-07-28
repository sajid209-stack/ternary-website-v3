/**
 * Client-safe half of the `/stories` feed contract: the taxonomy, the page size and the row shape.
 *
 * Kept apart from `feed.ts` on purpose. That module imports `payload` to read the collections, and
 * the list/row components are client components — importing the two from one file drags the whole
 * Payload server bundle (down to `node:fs`) into the browser build.
 */

export const FEED_PAGE_SIZE = 12

/** The four taxonomy terms the index filters on. */
export const FEED_CATEGORIES = ['story', 'pressRelease', 'insight', 'research'] as const
export type FeedCategory = (typeof FEED_CATEGORIES)[number]

export const FEED_CATEGORY_LABELS: Record<FeedCategory, string> = {
  story: 'Case Study',
  pressRelease: 'Press Release',
  insight: 'Insights',
  research: 'Research Report',
}

export interface FeedMedia {
  url: string
  /** `true` when the upload's mimeType is a video — the row renders a <video>, not an <img>. */
  isVideo: boolean
  /** Still frame for a video row; also the only thing shown under prefers-reduced-motion. */
  poster: string | null
}

export interface FeedItem {
  id: string
  category: FeedCategory
  title: string
  /** Category label, or the source label when the item points offsite. */
  eyebrow: string
  /**
   * Pre-formatted MM.DD.YYYY. Formatting on the server keeps the rows rendered server-side and the
   * pages appended by the client from disagreeing over the viewer's locale.
   */
  date: string
  href: string
  isExternal: boolean
  media: FeedMedia | null
}

export interface FeedPage {
  items: FeedItem[]
  /** Total matching the current filter, so the caller knows whether to offer "Load more". */
  total: number
}
