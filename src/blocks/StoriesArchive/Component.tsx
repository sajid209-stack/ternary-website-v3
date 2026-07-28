import StoriesList from '@/components/sections/stories/StoriesList'
import { getFeedCounts, getFeedPage } from '@/lib/stories/feed'
import type { StoriesArchiveBlock } from '@/payload-types'
import type { TypedLocale } from 'payload'
import type { JSX } from 'react'

/**
 * The stories index. Page one is fetched, merged and sliced on the server; the client receives
 * twelve rows and asks `/api/stories-feed` for each page after that.
 *
 * The block's curated `items` / `pressRelease` relationship lists are no longer read. Ordering now
 * lives on the documents themselves (`sortWeight`), so new content appears without an editor also
 * having to add it here. Both fields are left in place rather than dropped — removing them would
 * discard the existing curation before anyone has transcribed it into sort weights.
 */
export const StoriesArchiveComponent = async (
  data: StoriesArchiveBlock & { locale?: TypedLocale },
): Promise<JSX.Element> => {
  const locale = data.locale ?? 'en'
  const [firstPage, counts] = await Promise.all([getFeedPage({ locale }), getFeedCounts(locale)])

  return (
    <StoriesList
      heading={data.heading}
      description={data.description}
      locale={locale}
      initialItems={firstPage.items}
      initialTotal={firstPage.total}
      counts={counts}
    />
  )
}

export default StoriesArchiveComponent
