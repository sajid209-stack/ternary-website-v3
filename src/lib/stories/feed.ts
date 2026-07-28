import {
  FEED_CATEGORY_LABELS,
  FEED_PAGE_SIZE,
  type FeedCategory,
  type FeedItem,
  type FeedMedia,
  type FeedPage,
} from '@/lib/stories/feedTypes'
import config from '@/payload.config'
import type { Insight, Media, PressRelease, Story } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { unstable_cache } from 'next/cache'
import { getPayload, type TypedLocale } from 'payload'

/**
 * The `/stories` feed — one merged, curated list of every published story, insight and press
 * release.
 *
 * Ordering is `sortWeight` descending, then the item's own date descending. That is deliberately
 * not pure chronology: the list is edited, so an older piece can be held near the top by giving it
 * weight, and dates are free to run out of sequence.
 *
 * The merge happens here rather than in the database because the three collections are separate:
 * no single Payload query can sort across them. Each is read once, in full, on the SERVER and the
 * merged array is what gets paginated — the browser never receives more than a page. The read is
 * cached and tag-busted by the same collection hooks that already invalidate the detail routes.
 */

type FeedDoc = Story | Insight | PressRelease

function asMedia(value: unknown): Media | null {
  return value && typeof value === 'object' ? (value as Media) : null
}

/** MM.DD.YYYY, UTC — the reference's date format. */
function formatFeedDate(value?: string | null): string {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(parsed.getUTCDate()).padStart(2, '0')
  return `${mm}.${dd}.${parsed.getUTCFullYear()}`
}

function detailHref(category: FeedCategory, slug: string): string {
  switch (category) {
    case 'story':
    case 'research':
      return `/case-studies/${slug}`
    case 'insight':
      return `/insights/${slug}`
    case 'pressRelease':
      return `/press-release/${slug}`
  }
}

function resolveMedia(doc: FeedDoc): FeedMedia | null {
  const thumb = asMedia(doc.thumbnail)
  const url = thumb ? getMediaUrl(thumb.url, thumb.updatedAt) : ''
  if (!url) return null
  const poster = asMedia(doc.posterImage)
  return {
    url,
    isVideo: typeof thumb?.mimeType === 'string' && thumb.mimeType.startsWith('video/'),
    poster: poster ? getMediaUrl(poster.url, poster.updatedAt) || null : null,
  }
}

/** The date a doc sorts and displays by — each collection names its own. */
function docDate(doc: FeedDoc): string | null {
  if ('releaseDate' in doc && doc.releaseDate) return doc.releaseDate
  if ('publishedDate' in doc && doc.publishedDate) return doc.publishedDate
  return null
}

function normalize(doc: FeedDoc, category: FeedCategory): FeedItem | null {
  if (!doc.slug) return null
  const isExternal = doc.linkType === 'external' && Boolean(doc.externalUrl)
  return {
    id: `${category}-${doc.id}`,
    category,
    title: doc.title ?? 'Untitled',
    eyebrow: (isExternal && doc.sourceLabel) || FEED_CATEGORY_LABELS[category],
    date: formatFeedDate(docDate(doc)),
    href: isExternal ? doc.externalUrl! : detailHref(category, doc.slug),
    isExternal,
    media: resolveMedia(doc),
  }
}

/** Sort key: weight first (higher earlier), then date (newer earlier). */
function compare(a: { weight: number; time: number }, b: { weight: number; time: number }): number {
  return b.weight - a.weight || b.time - a.time
}

async function fetchFeed(locale: TypedLocale): Promise<FeedItem[]> {
  const payload = await getPayload({ config })
  // depth 1 hydrates `thumbnail` and `posterImage`; nothing deeper is rendered on a row.
  const query = { limit: 500, depth: 1, locale, sort: '-createdAt' } as const

  const [stories, insights, press] = await Promise.all([
    payload.find({ collection: 'story', ...query }),
    payload.find({ collection: 'insight', ...query }),
    payload.find({ collection: 'pressRelease', ...query }),
  ])

  const sortable: { item: FeedItem; weight: number; time: number }[] = []
  const collect = (docs: FeedDoc[], category: FeedCategory) => {
    for (const doc of docs) {
      const item = normalize(doc, category)
      if (!item) continue
      const raw = docDate(doc)
      sortable.push({
        item,
        weight: typeof doc.sortWeight === 'number' ? doc.sortWeight : 0,
        time: raw ? new Date(raw).getTime() || 0 : 0,
      })
    }
  }

  collect(stories.docs as Story[], 'story')
  collect(insights.docs as Insight[], 'insight')
  collect(press.docs as PressRelease[], 'pressRelease')

  return sortable.sort(compare).map((entry) => entry.item)
}

/** Tag-busted by the existing story/insight/pressRelease afterChange + afterDelete hooks. */
function getFeed(locale: TypedLocale): Promise<FeedItem[]> {
  return unstable_cache(() => fetchFeed(locale), [`stories_feed_${locale}_v1`], {
    tags: ['story', 'insight', 'pressRelease'],
  })()
}

export interface FeedQuery {
  locale: TypedLocale
  category?: FeedCategory | 'all'
  search?: string
  page?: number
}

/**
 * One page of the feed. Filtering and slicing both happen on the server; the client only ever
 * receives `FEED_PAGE_SIZE` rows per request.
 */
export async function getFeedPage({ locale, category = 'all', search = '', page = 1 }: FeedQuery): Promise<FeedPage> {
  const all = await getFeed(locale)
  const query = search.trim().toLowerCase()

  const matching = all.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category
    const matchesSearch = !query || item.title.toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })

  const start = (Math.max(1, page) - 1) * FEED_PAGE_SIZE
  return { items: matching.slice(start, start + FEED_PAGE_SIZE), total: matching.length }
}

/** Counts per chip/option, so the filter can show what it would yield. */
export async function getFeedCounts(locale: TypedLocale): Promise<Record<FeedCategory | 'all', number>> {
  const all = await getFeed(locale)
  const counts = { all: all.length, story: 0, pressRelease: 0, insight: 0, research: 0 }
  for (const item of all) counts[item.category] += 1
  return counts
}
