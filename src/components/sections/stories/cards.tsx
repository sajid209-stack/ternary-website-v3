import Motion from '@/components/animation/motion'
import Link from '@/components/LocalizedLink'
import { GradientPanel, toneFor, type Tone } from '@/components/sections/stories/gradient'
import type { Insight } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { ArrowUpRight, Clock } from 'lucide-react'
import type { JSX } from 'react'

/**
 * The card layer for the standalone insights list block (`InsightsList`).
 *
 * This was the shared archive card layer until the `/stories` index became a row list: the
 * gradient tile, the case-study feature card and the press-release text card all existed only for
 * that grid and were removed with it. `InsightsList` is the sole remaining consumer, so the
 * bento pair below plus their shared fragments are all that is left.
 *
 * This module has no hooks, so it is safe to render from a Server Component; the `Motion`/`Link`
 * children are their own client islands.
 */

export type ContentType = 'story' | 'insight' | 'pressRelease' | 'research'

/** Pill / type label shown on each card (matches the Figma card badges). */
export const CATEGORY_LABELS: Record<ContentType, string> = {
  story: 'Case Study',
  insight: 'Insights',
  pressRelease: 'Press Release',
  research: 'Research Report',
}

/** A type-erased card model so stories, insights and press releases render through one card. */
export interface NormalizedItem {
  id: string
  type: ContentType
  href: string
  title: string
  excerpt?: string | null
  code?: string | null
  date?: string | null
  readTime?: string | null
  /** The doc's own category label (e.g. "Engineering Studio") shown in the meta row. */
  studioLabel?: string | null
  /** Resolved thumbnail URL (insights render an image tile; falls back to a gradient). */
  image?: string | null
  categoryLabel?: string | null
  tone: Tone
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function formatDate(date?: string | null): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function detailHref(type: ContentType, slug: string): string {
  switch (type) {
    case 'story':
    case 'research':
      return `/case-studies/${slug}`
    case 'insight':
      return `/insights/${slug}`
    case 'pressRelease':
      return `/press-release/${slug}`
  }
}

/** Normalize an `insight` doc into the shared card model. */
export function normalizeInsight(doc: Insight, index: number): NormalizedItem {
  const rawRead = doc.readTime
  const thumb = doc.thumbnail
  return {
    id: `insight-${doc.id}`,
    type: 'insight',
    href: detailHref('insight', doc.slug),
    title: doc.title ?? 'Untitled',
    excerpt: doc.excerpts,
    code: doc.code,
    date: doc.publishedDate,
    readTime: typeof rawRead === 'string' && rawRead ? rawRead : null,
    studioLabel: doc.categoryLabel,
    image: thumb && typeof thumb === 'object' ? getMediaUrl(thumb.url, thumb.updatedAt) : null,
    categoryLabel: CATEGORY_LABELS.insight,
    tone: toneFor('insight', index),
  }
}

const motionGridItemProps = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' as const },
}

/* ------------------------------------------------------------------ */
/* Shared card fragments                                              */
/* ------------------------------------------------------------------ */

/** The rounded outline badge that sits above every card title. */
function CardPill({ label }: { label?: string | null }): JSX.Element | null {
  if (!label) return null
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-subtle bg-main px-4 py-2 font-display text-lg leading-none tracking-[-0.05em] text-cream">
      {label}
    </span>
  )
}

/** Code (e.g. CS-014) on the left, formatted date on the right. */
function CodeDateRow({ item }: { item: NormalizedItem }): JSX.Element | null {
  if (!item.code && !item.date) return null
  return (
    <div className="flex items-center justify-between text-[12px] tracking-[-0.05em] text-body">
      <span>{item.code ?? ''}</span>
      <span>{formatDate(item.date)}</span>
    </div>
  )
}

/** Divider + read-time · studio on the left, a Read affordance that nudges on hover. */
function MetaFooter({ item }: { item: NormalizedItem }): JSX.Element {
  return (
    <div className="flex items-center justify-between border-t border-subtle pt-4 text-[12px] tracking-[-0.05em] text-body">
      <span className="flex min-w-0 items-center gap-2">
        <Clock size={12} className="shrink-0" aria-hidden />
        <span className="truncate">
          {item.readTime ?? '12 min'}
          {item.studioLabel ? ` · ${item.studioLabel}` : ''}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-base text-cream transition-all group-hover:gap-2 motion-reduce:group-hover:gap-1">
        Read <ArrowUpRight size={14} aria-hidden />
      </span>
    </div>
  )
}

/** Image tile for insight cards — real thumbnail when present, signature gradient otherwise. */
function InsightMedia({ item }: { item: NormalizedItem }): JSX.Element {
  if (item.image) {
    return (
      <>
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25" />
      </>
    )
  }
  return <GradientPanel tone={item.tone} interactive scrim="none" />
}

/* ------------------------------------------------------------------ */
/* Card variants                                                      */
/* ------------------------------------------------------------------ */

/**
 * Insight card — signature image/gradient tile on top, then pill, Poppins title, excerpt,
 * code + date and the meta footer. Fills a single bento column.
 */
export function InsightImageCard({ item, index }: { item: NormalizedItem; index: number }): JSX.Element {
  return (
    <Motion
      tag="div"
      {...motionGridItemProps}
      transition={{ duration: 0.55, ease: EASE, delay: Math.min(index * 0.05, 0.4) }}
      className="h-full"
    >
      <Link
        href={item.href}
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-main transition-colors duration-300 hover:border-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
      >
        <div className="relative aspect-[482/440] w-full overflow-hidden">
          <InsightMedia item={item} />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6">
          <CardPill label={item.categoryLabel} />
          <h3 className="line-clamp-2 font-display text-2xl font-medium leading-[1.15] tracking-[-0.05em] text-cream">
            {item.title}
          </h3>
          {item.excerpt && (
            <p className="line-clamp-3 text-base leading-[1.15] tracking-[-0.05em] text-body">{item.excerpt}</p>
          )}
          <div className="mt-auto flex flex-col gap-3">
            <CodeDateRow item={item} />
            <MetaFooter item={item} />
          </div>
        </div>
      </Link>
    </Motion>
  )
}

/**
 * Wide insight card (bento accent) — spans two columns: pill + title + excerpt on top, a
 * wide image band in the middle, and the code/date + meta footer beneath.
 */
export function InsightWideCard({ item, index }: { item: NormalizedItem; index: number }): JSX.Element {
  return (
    <Motion
      tag="div"
      {...motionGridItemProps}
      transition={{ duration: 0.55, ease: EASE, delay: Math.min(index * 0.05, 0.4) }}
      className="h-full md:col-span-2 lg:col-span-2"
    >
      <Link
        href={item.href}
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-main transition-colors duration-300 hover:border-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
      >
        <div className="flex flex-col gap-3 p-6 pb-4">
          <CardPill label={item.categoryLabel} />
          <h3 className="line-clamp-2 font-display text-2xl font-medium leading-[1.15] tracking-[-0.05em] text-cream">
            {item.title}
          </h3>
          {item.excerpt && (
            <p className="line-clamp-2 text-base leading-[1.15] tracking-[-0.05em] text-body">{item.excerpt}</p>
          )}
        </div>
        <div className="relative min-h-[240px] w-full flex-1 overflow-hidden">
          <InsightMedia item={item} />
        </div>
        <div className="flex flex-col gap-3 p-6 pt-4">
          <CodeDateRow item={item} />
          <MetaFooter item={item} />
        </div>
      </Link>
    </Motion>
  )
}
