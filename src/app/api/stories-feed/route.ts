import { getFeedPage } from '@/lib/stories/feed'
import { FEED_CATEGORIES, type FeedCategory } from '@/lib/stories/feedTypes'
import { asTypedLocale } from '@/lib/i18n/locales'
import { NextResponse } from 'next/server'

/**
 * Pages the `/stories` feed for the client's "Load more" button.
 *
 * The merge, filter and slice all happen server-side in `getFeedPage`, so a response carries at
 * most one page of rows — the browser never holds the whole collection. Read-only and public,
 * matching the collections' own `read: anyone` access.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)

  const locale = asTypedLocale(searchParams.get('locale') ?? 'en')
  if (!locale) return NextResponse.json({ error: 'Unknown locale' }, { status: 400 })

  const rawCategory = searchParams.get('category') ?? 'all'
  const category: FeedCategory | 'all' =
    rawCategory === 'all' || (FEED_CATEGORIES as readonly string[]).includes(rawCategory)
      ? (rawCategory as FeedCategory | 'all')
      : 'all'

  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)

  const result = await getFeedPage({
    locale,
    category,
    search: searchParams.get('search') ?? '',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  })

  return NextResponse.json(result)
}
