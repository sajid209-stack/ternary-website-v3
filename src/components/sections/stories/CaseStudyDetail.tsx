import Motion from '@/components/animation/motion'
import { EASE, reveal, revealItem } from '@/components/animation/reveal'
import MobileCarousel from '@/components/layout/MobileCarousel'
import Link from '@/components/LocalizedLink'
import NumberedSteps from '@/components/NumberedSteps'
import RichTextComp, { type RichText } from '@/components/richtext'
import { GradientPanel, type Tone, toneFor } from '@/components/sections/stories/gradient'
import type { Media, Story } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import type { JSX } from 'react'

/**
 * Case-study detail — editorial, media-forward presentation (fantasy.co study, see
 * audit/case-studies/INSPIRATION.md): one large hero media moment, short confident
 * statements, mono numbered section markers, and a roomy single-idea vertical rhythm.
 * Every band is guarded on its data; missing media renders a clearly-labeled brand
 * GradientPanel placeholder structured to accept a client image/video later.
 */

/** A related-case-study card for the carousel — real thumbnail when present, gradient otherwise. */
export interface RelatedStoryCardData {
  href: string
  title: string
  excerpt?: string | null
  code?: string | null
  date?: string | null
  readTime?: string | null
  categoryLabel?: string | null
  image?: string | null
  tone: Tone
}

interface CaseStudyDetailProps {
  story: Story
  backHref: string
  related?: RelatedStoryCardData[]
}

/** Clean, non-empty entries from a localized array field. */
function cleanList<T extends Record<string, unknown>>(list: T[] | null | undefined, key: keyof T): T[] {
  return (list ?? []).filter((item) => {
    const value = item?.[key]
    return typeof value === 'string' && value.trim().length > 0
  })
}

function hasText(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** Populated media doc (depth ≥ 1) or null — string ids have nothing to render. */
function asMedia(value: Story['thumbnail']): Media | null {
  return value && typeof value === 'object' ? value : null
}

// Mirrors the capability detail's Palantir-style marker: "01 / Label", mono + tabular.
function SectionMarker({ index, label }: { index: number; label: string }): JSX.Element {
  return (
    <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-subtle">
      <span className="tabular-nums text-cream/70">{String(index).padStart(2, '0')}</span>
      <span aria-hidden className="text-subtle/50">
        /
      </span>
      <span>{label}</span>
    </p>
  )
}

/** One gallery cell — image now, `<video>` for video mimeTypes, caption underneath. */
function ShowcaseCell({
  media,
  caption,
  index,
}: {
  media: Media
  caption?: string | null
  index: number
}): JSX.Element | null {
  const url = getMediaUrl(media.url, media.updatedAt)
  if (!url) return null
  const isVideo = typeof media.mimeType === 'string' && media.mimeType.startsWith('video/')

  return (
    <Motion tag="figure" {...revealItem(index)} className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md ring-1 ring-white/5">
        {isVideo ? (
          // Silent product-visual clips; any caption text renders in the adjacent <figcaption>.
          <video src={url} controls muted playsInline preload="metadata" className="size-full object-cover" />
        ) : (
          <img src={url} alt={media.alt || ''} loading="lazy" className="size-full object-cover" />
        )}
      </div>
      {hasText(caption) && (
        <figcaption className="font-mono text-[12px] tracking-[-0.01em] text-subtle">{caption}</figcaption>
      )}
    </Motion>
  )
}

/** Placeholder tile for the showcase grid — brand gradient, clearly labeled, awaiting client assets. */
function ShowcasePlaceholder({ tone, index }: { tone: Tone; index: number }): JSX.Element {
  return (
    <Motion tag="div" {...revealItem(index)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md ring-1 ring-white/5">
        <GradientPanel tone={tone} scrim="none" />
        <div className="relative flex h-full items-end p-5">
          <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-[12px] tracking-[-0.01em] text-cream/85 backdrop-blur-sm">
            Product visuals — coming soon
          </span>
        </div>
      </div>
    </Motion>
  )
}

export default function CaseStudyDetail({ story, backHref, related = [] }: CaseStudyDetailProps): JSX.Element {
  const heroTone = toneFor('story', 0)
  const tags = cleanList(story.tags, 'name')

  const heroMedia = asMedia(story.thumbnail)
  const heroUrl = heroMedia ? getMediaUrl(heroMedia.url, heroMedia.updatedAt) : ''
  const heroIsVideo = typeof heroMedia?.mimeType === 'string' && heroMedia.mimeType.startsWith('video/')

  // Meta strip — only cells that carry a value (empty slots never render).
  const meta = story.caseMeta
  const metaCells: { label: string; value: string }[] = []
  if (hasText(meta?.industry)) metaCells.push({ label: 'Industry', value: meta!.industry! })
  if (hasText(meta?.engagement)) metaCells.push({ label: 'Engagement', value: meta!.engagement! })
  if (hasText(meta?.duration)) metaCells.push({ label: 'Duration', value: meta!.duration! })
  if (hasText(meta?.team)) metaCells.push({ label: 'Team', value: meta!.team! })
  if (hasText(meta?.year)) metaCells.push({ label: 'Year', value: meta!.year! })

  const hasBody = Boolean(story.content)

  // "How we worked" — authored rows only; a row needs both halves to render a step.
  const steps = (story.steps ?? []).flatMap((row) =>
    hasText(row.title) && hasText(row.body) ? [{ title: row.title, body: row.body }] : [],
  )
  const showSteps = steps.length >= 2

  // Media showcase — populated gallery rows only; falls back to a labeled placeholder grid.
  const galleryItems = (story.gallery ?? []).flatMap((row) => {
    const media = asMedia(row.media ?? null)
    return media ? [{ media, caption: row.caption ?? null }] : []
  })

  // Section numbering, derived rather than hardcoded so a band that doesn't render for this story
  // never leaves a gap in the "01 / 02 / 03" sequence.
  const sections = [
    ...(hasBody ? (['story'] as const) : []),
    ...(showSteps ? (['steps'] as const) : []),
    'product' as const,
    ...(related.length > 0 ? (['related'] as const) : []),
  ]
  const sectionNo = (key: (typeof sections)[number]): number => sections.indexOf(key) + 1

  return (
    <article className="w-full pb-24 lg:pb-32">
      {/* Breadcrumb */}
      <div className="mx-auto w-full max-w-7xl px-5 pt-6 md:px-8 lg:px-12">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-md font-mono text-[13px] tracking-[-0.01em] text-subtle transition-colors hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
        >
          <ArrowLeft size={14} aria-hidden />
          All case studies
        </Link>
      </div>

      {/* Hero — eyebrow, big statement title, one confident line, chips */}
      <header className="mx-auto w-full max-w-7xl px-5 pt-12 md:px-8 lg:px-12 lg:pt-20">
        <Motion tag="div" {...reveal} transition={{ duration: 0.7, ease: EASE }} className="max-w-4xl">
          <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-subtle">
            Case study{hasText(meta?.industry) ? ` · ${meta!.industry!}` : ''}
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.25rem,5.5vw,3.75rem)] font-medium leading-[1.04] tracking-[-0.04em] text-cream">
            {story.title}
          </h1>
          {hasText(story.excerpts) && (
            <p className="mt-6 max-w-2xl text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed tracking-[-0.01em] text-body">
              {story.excerpts}
            </p>
          )}
          {tags.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <li
                  key={`${tag.name}-${i}`}
                  className="rounded-full border border-badge px-3 py-1 font-mono text-[12px] tracking-[-0.01em] text-body"
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          )}
        </Motion>
      </header>

      {/* Hero media — the story's CMS media leads; labeled gradient placeholder otherwise. */}
      <Motion
        tag="div"
        {...reveal}
        transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        className="mx-auto mt-12 w-full max-w-7xl px-5 md:px-8 lg:mt-16 lg:px-12"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md ring-1 ring-white/5 sm:aspect-[16/8] lg:aspect-[16/7]">
          {heroUrl ? (
            heroIsVideo ? (
              // Silent hero product clip; the surrounding article carries the narrative.
              <video src={heroUrl} controls muted playsInline preload="metadata" className="size-full object-cover" />
            ) : (
              <img src={heroUrl} alt={heroMedia?.alt || ''} className="size-full object-cover" />
            )
          ) : (
            <>
              <GradientPanel tone={heroTone} scrim="none" />
              <div className="relative flex h-full items-end p-6">
                <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-[12px] tracking-[-0.01em] text-cream/85 backdrop-blur-sm">
                  Feature media — coming soon
                </span>
              </div>
            </>
          )}
        </div>

        {/* Meta strip — quiet hairline row beneath the media, mono labels, guarded cells. */}
        {metaCells.length > 0 && (
          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-line pt-8 sm:grid-cols-3 lg:grid-cols-5">
            {metaCells.map((cell) => (
              <div key={cell.label} className="flex flex-col gap-2">
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">{cell.label}</dt>
                <dd className="text-[15px] tracking-[-0.01em] text-cream">{cell.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Motion>

      {/* The story — sticky mono rail + editorial prose */}
      {hasBody ? (
        <div className="mx-auto w-full max-w-7xl px-5 py-24 md:px-8 lg:px-12 lg:py-32">
          <Motion tag="div" {...reveal} className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionMarker index={sectionNo('story')} label="The story" />
              <p className="mt-4 text-[15px] leading-[1.5] tracking-[-0.01em] text-body">
                How we approached the work, what we built, and why it matters.
              </p>
            </div>
            <div className="max-w-[74ch] [&_a]:text-cream [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-subtle [&_blockquote]:pl-5 [&_h2]:font-display [&_h3]:font-display [&_p]:tracking-[-0.01em]">
              <RichTextComp content={story.content as RichText} />
            </div>
          </Motion>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-7xl px-5 py-24 md:px-8 lg:px-12 lg:py-32">
          <Motion tag="div" {...reveal} className="rounded-md border border-white/5 bg-ink/40 px-6 py-16 text-center">
            <p className="text-base tracking-[-0.01em] text-cream">The full write-up is on its way.</p>
            <p className="mx-auto mt-2 max-w-md text-sm tracking-[-0.01em] text-subtle">
              We’re still documenting this engagement. In the meantime, explore our other case studies below.
            </p>
          </Motion>
        </div>
      )}

      {/* How we worked — the numbered sequence, CMS-driven (story.steps). Sits between the
          write-up and the product visuals: the reader has just finished the narrative, and this
          is the "so how did you actually do it" beat before the screens. Hidden when unauthored. */}
      {showSteps && (
        <section className="mx-auto w-full max-w-7xl px-5 pb-24 md:px-8 lg:px-12 lg:pb-32">
          <Motion tag="div" {...reveal} className="mb-10 flex max-w-2xl flex-col gap-5">
            <SectionMarker index={sectionNo('steps')} label="How we worked" />
          </Motion>
          <NumberedSteps steps={steps} />
        </section>
      )}

      {/* Media showcase — gallery when authored; a clearly-labeled placeholder grid otherwise. */}
      <section className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-12">
        <Motion tag="div" {...reveal} className="mb-10 flex max-w-2xl flex-col gap-5">
          <SectionMarker index={sectionNo('product')} label="In the product" />
          <h2 className="font-display text-[clamp(1.5rem,3vw,1.875rem)] font-medium leading-[1.15] tracking-[-0.03em] text-cream">
            The work, up close.
          </h2>
        </Motion>
        {galleryItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {galleryItems.map((item, index) => (
              <ShowcaseCell key={item.media.id ?? index} media={item.media} caption={item.caption} index={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(['indigo', 'magenta', 'emerald'] as const).map((tone, index) => (
              <ShowcasePlaceholder key={tone} tone={tone} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Related case studies */}
      {related.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-5 pt-24 md:px-8 lg:px-12 lg:pt-32">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div className="flex flex-col gap-5">
              <SectionMarker index={sectionNo('related')} label="More of the work" />
              <h2 className="font-display text-[clamp(1.5rem,3vw,1.875rem)] font-medium tracking-[-0.04em] text-cream">
                Related case studies.
              </h2>
            </div>
            <Link
              href={backHref}
              className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm tracking-[-0.01em] text-cream transition-colors hover:text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
            >
              All case studies <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>
          {/* Mobile: horizontal snap carousel with pagination dots. */}
          <MobileCarousel slideClassName="w-[280px]">
            {related.map((card, index) => (
              <RelatedStoryCard key={card.href} card={card} index={index} />
            ))}
          </MobileCarousel>

          {/* sm+ grid — hidden on mobile, where the carousel takes over. */}
          <div className="hidden gap-4 sm:grid md:grid-cols-2 lg:grid-cols-3">
            {related.map((card, index) => (
              <RelatedStoryCard key={card.href} card={card} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="mx-auto w-full max-w-7xl px-5 pt-24 md:px-8 lg:px-12 lg:pt-32">
        <div className="relative overflow-hidden rounded-md ring-1 ring-white/10">
          <GradientPanel tone="violet" />
          <div className="relative flex flex-col items-center gap-6 p-8 text-center lg:flex-row lg:items-center lg:justify-between lg:p-12 lg:text-left">
            <div className="max-w-xl">
              <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-medium leading-[1.12] tracking-[-0.03em] text-cream">
                Have a similar problem worth solving?
              </h2>
              <p className="mt-3 text-[15px] leading-[1.55] tracking-[-0.01em] text-cream/85">
                Tell us where you’re headed. We’ll bring the engineering discipline to get you there.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-md bg-cream px-5 py-3 text-sm font-medium tracking-[-0.01em] text-ink transition-colors hover:bg-cream-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
            >
              Get in touch <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}

function RelatedStoryCard({ card, index }: { card: RelatedStoryCardData; index: number }): JSX.Element {
  return (
    <Motion tag="div" {...revealItem(index)} className="h-full">
      <Link
        href={card.href}
        className="group flex h-full flex-col overflow-hidden rounded-md border border-white/5 bg-main transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <div className="relative h-[200px] w-full overflow-hidden">
          {card.image ? (
            <>
              <img
                src={card.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent to-50%" />
            </>
          ) : (
            <GradientPanel tone={card.tone} interactive />
          )}
          <div className="relative flex h-full flex-col justify-between p-5">
            <span className="inline-flex w-fit items-center rounded-full bg-black/30 px-3 py-1 font-mono text-[12px] tracking-[-0.01em] text-cream backdrop-blur-sm">
              {card.categoryLabel ?? 'Case Study'}
            </span>
            {(card.code || card.date) && (
              <div className="flex items-center justify-between font-mono text-[12px] tracking-[-0.02em] text-cream/85">
                <span>{card.code ?? ''}</span>
                <span>{card.date ?? ''}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="line-clamp-2 font-display text-xl font-medium leading-[1.18] tracking-[-0.03em] text-cream">
            {card.title}
          </h3>
          {card.excerpt && (
            <p className="mt-3 line-clamp-2 text-[15px] leading-[1.5] tracking-[-0.01em] text-body">{card.excerpt}</p>
          )}
          <div className="mt-5 flex items-center justify-between border-t border-subtle/60 pt-4 text-[12px] tracking-[-0.02em] text-body">
            <span className="truncate">{card.categoryLabel ?? 'Case Study'}</span>
            <span className="flex shrink-0 items-center gap-1 text-sm text-cream transition-all group-hover:gap-2 motion-reduce:group-hover:gap-1">
              Read <ArrowUpRight size={14} aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </Motion>
  )
}

export { RelatedStoryCard }
