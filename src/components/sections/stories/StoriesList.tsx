'use client'

import RichTextComp, { type RichText } from '@/components/richtext'
import StoryRow from '@/components/sections/stories/StoryRow'
import {
  FEED_CATEGORIES,
  FEED_CATEGORY_LABELS,
  FEED_PAGE_SIZE,
  type FeedCategory,
  type FeedItem,
} from '@/lib/stories/feedTypes'
import { AnimatePresence, motion } from 'motion/react'
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type JSX } from 'react'

/**
 * The `/stories` index — one continuous single-column list.
 *
 * Filtering is a single quiet dropdown rather than a row of chips, and it writes `?category=` so a
 * filtered view is a shareable URL. Paging is server-side: "Load more" asks the route handler for
 * the next page and appends it, so the browser never holds more than it has shown.
 */

interface StoriesListProps {
  heading?: string | null
  description?: RichText | string | null
  locale: string
  initialItems: FeedItem[]
  initialTotal: number
  counts: Record<FeedCategory | 'all', number>
}

/** `?category=` if it names one of the four terms, else "all". */
function readCategory(params: URLSearchParams | ReadonlyURLSearchParams): FeedCategory | 'all' {
  const raw = params.get('category')
  return raw && (FEED_CATEGORIES as readonly string[]).includes(raw) ? (raw as FeedCategory) : 'all'
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function StoriesList({
  heading,
  description,
  locale,
  initialItems,
  initialTotal,
  counts,
}: StoriesListProps): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // The server always renders the unfiltered first page, so a shared `?category=` URL is applied
  // here on mount. Seeding state from the URL (rather than threading searchParams down through
  // RenderBlocks into every block) keeps the filter's plumbing inside this component.
  const urlCategory = readCategory(searchParams)
  const [category, setCategory] = useState<FeedCategory | 'all'>(urlCategory)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState(false)

  // Skip the first effect only when the server's render already matches: an unfiltered view. A
  // deep-linked category has to fetch once on mount.
  const hydrated = useRef(urlCategory !== 'all')

  const load = useCallback(
    async (nextCategory: FeedCategory | 'all', nextSearch: string, nextPage: number, append: boolean) => {
      setPending(true)
      try {
        const params = new URLSearchParams({
          locale,
          category: nextCategory,
          search: nextSearch,
          page: String(nextPage),
        })
        const res = await fetch(`/api/stories-feed?${params}`)
        if (!res.ok) return
        const data = (await res.json()) as { items: FeedItem[]; total: number }
        setItems((prev) => (append ? [...prev, ...data.items] : data.items))
        setTotal(data.total)
        setPage(nextPage)
      } finally {
        setPending(false)
      }
    },
    [locale],
  )

  // Category / search changes reset to page 1. Debounced so typing does not fire a request a key.
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    const timer = setTimeout(() => void load(category, search, 1, false), 250)
    return () => clearTimeout(timer)
  }, [category, search, load])

  const onCategoryChange = (next: FeedCategory | 'all') => {
    setCategory(next)
    // Shareable state: the filtered view has its own URL. `scroll: false` keeps the reader in place.
    const params = new URLSearchParams(searchParams.toString())
    if (next === 'all') params.delete('category')
    else params.set('category', next)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const hasMore = items.length < total

  return (
    <section className="w-full">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        {(heading || description) && (
          <div className="flex max-w-[724px] flex-col gap-4">
            {heading && (
              <h2 className="font-display text-[clamp(1.5rem,3vw,1.875rem)] font-medium leading-[1.15] tracking-[-0.05em] text-cream opacity-90">
                {heading}
              </h2>
            )}
            {description && (
              <RichTextComp
                content={description}
                className="opacity-90 prose-p:mb-0 prose-p:text-base prose-p:font-normal prose-p:leading-[1.15] prose-p:tracking-[-0.05em] prose-p:text-body"
              />
            )}
          </div>
        )}

        {/* Filter + search, kept top-right and well away from the rows. */}
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-56">
            <Search size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles…"
              aria-label="Search stories"
              className="h-9 w-full rounded-full border border-line bg-page pl-10 pr-4 text-sm tracking-[-0.01em] text-cream placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cream"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="stories-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="stories-category"
              value={category}
              onChange={(event) => onCategoryChange(event.target.value as FeedCategory | 'all')}
              className="h-9 rounded-full border border-line bg-page px-4 text-sm tracking-[-0.01em] text-subtle transition-colors hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cream"
            >
              <option value="all">All ({counts.all})</option>
              {FEED_CATEGORIES.map((key) => (
                <option key={key} value={key}>
                  {FEED_CATEGORY_LABELS[key]} ({counts[key]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cross-fade on filter change so the entry stagger does not re-run on every switch. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${category}-${search}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="mt-10"
        >
          {items.length > 0 ? (
            <ul className="border-b border-line">
              {items.map((item, index) => (
                <StoryRow key={item.id} item={item} index={index % FEED_PAGE_SIZE} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-4 border-t border-line py-20 text-center">
              <p className="text-base tracking-[-0.01em] text-cream">Nothing here yet.</p>
              <p className="max-w-sm text-sm tracking-[-0.01em] text-subtle">
                Try a different filter, or clear the search to see everything.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => void load(category, search, page + 1, true)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-page px-6 py-3 text-sm tracking-[-0.01em] text-cream transition-colors hover:border-cream disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
          >
            {pending ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  )
}
