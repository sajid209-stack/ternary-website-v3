import Motion from '@/components/animation/motion'
import CapabilityArt from '@/components/capability/CapabilityArt'
import { TONE, toneFor } from '@/components/layout/GradientPanel'
import Link from '@/components/LocalizedLink'
import NumberedSteps, { TONE_RGB } from '@/components/NumberedSteps'
import RichTextComp, { type RichText } from '@/components/richtext'
import { asTypedLocale, LOCALES } from '@/lib/i18n/locales'
import { generateMeta } from '@/lib/seo/generateMeta'
import { cn } from '@/lib/utils'
import type { Capability } from '@/payload-types'
import config from '@/payload.config'
import { getNodeText } from '@/utilities/headings'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import type { TypedLocale } from 'payload'
import { getPayload } from 'payload'
import type { JSX } from 'react'

// SSG: prebuild known slugs (generateStaticParams below) and serve them statically. Freshness is
// purely tag-driven (no time-based revalidate) — the capability afterChange/afterDelete hooks bust
// the tags below. dynamicParams lets slugs not in the prebuilt set render on demand.
export const dynamicParams = true

const getCapabilityList = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'capability',
      limit: 100,
      depth: 0,
    })
    return result.docs
  },
  ['capability'],
  { tags: ['capability'] },
)

async function fetchCapabilityBySlug(slug: string, locale: TypedLocale): Promise<Capability | null> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'capability',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
    depth: 2,
  })
  return (result.docs[0] as Capability | undefined) ?? null
}

// Tag-based ISR (WEB-457): published reads are cached and busted on-demand by the
// `revalidateTag('capability')` / `revalidateTag('capability_<slug>')` calls in the capability
// afterChange hook. In draft mode (live preview) we bypass the cache so editors see fresh data.
async function getCapabilityBySlug(slug: string, locale: TypedLocale): Promise<Capability | null> {
  const { isEnabled: draft } = await draftMode()
  if (draft) return fetchCapabilityBySlug(slug, locale)
  // _v7: the proof-section seed (scripts/seed-proof-sections.js) fills caseStudies — new data
  // must surface past any persisted _v6 cache entries.
  return unstable_cache(() => fetchCapabilityBySlug(slug, locale), [`capability_${slug}_${locale}_v7`], {
    // `team`: the practice-lead section embeds a team doc (depth 2), so editing that team member
    // must bust this page too.
    tags: [`capability_${slug}`, 'capability', 'team'],
  })()
}

export async function generateStaticParams() {
  const capabilities = await getCapabilityList()
  // Cross-product: one entry per {locale, slug}.
  return LOCALES.flatMap((locale) => capabilities.map((capability) => ({ locale, slug: capability.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const typedLocale = asTypedLocale(locale)
  if (!typedLocale) return {}
  const capability = await getCapabilityBySlug(slug, typedLocale)

  if (!capability) return {}

  // heroSection.description is Lexical richText now — flatten to plain text for the meta tag.
  // (Unmigrated DB rows may still hold a plain string; pass those through untouched.)
  const heroDescription = capability.heroSection?.description as RichText | string | null | undefined
  const heroDescriptionText =
    typeof heroDescription === 'string' ? heroDescription : heroDescription ? getNodeText(heroDescription.root) : null

  return generateMeta({
    doc: capability,
    fallbackTitle: 'Capability',
    fallbackDescription: capability.excerpts || heroDescriptionText,
    pathname: `/capabilities/${slug}`,
    locale: typedLocale,
  })
}

// ---------------------------------------------------------------------------------------------
// Presentation — premium redesign (design/capability-detail-redesign), made data-driven.
//
// The page moves the reader through one arc: what it is → how we do it → proof → related → talk,
// with each section given a visibly different layout so the page reads as a progression, never
// repetition. There is exactly ONE definitional moment (Section 01). Every section is guarded on
// its heading/array so a capability with sparse data degrades gracefully rather than showing an
// empty shell. Client names and metrics stay clearly-marked placeholders — we never fabricate.
// ---------------------------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// Shared reveal — quiet upward fade, fires once. Motion already honors prefers-reduced-motion.
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' } as const,
  transition: { duration: 0.6, ease: EASE },
}

const revealItem = (index: number) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' } as const,
  transition: { duration: 0.55, ease: EASE, delay: Math.min(index * 0.07, 0.42) },
})

// Focus-visible affordance shared across every interactive element (matches the detail routes).
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 focus-visible:ring-offset-2 focus-visible:ring-offset-page'

// Palantir-style section marker: "Section 02 / Label", tabular numerals, tight functional label.
function SectionMarker({ index, label }: { index: number; label: string }): JSX.Element {
  return (
    <p className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-subtle">
      <span className="tabular-nums text-cream/70">{`Section ${String(index).padStart(2, '0')}`}</span>
      <span aria-hidden className="text-subtle/50">
        /
      </span>
      <span>{label}</span>
    </p>
  )
}

// A Lexical richText value is non-empty when its root has at least one child node. Empty editors
// still serialize a root with an empty children array, so a truthy check alone is not enough.
function hasRichText(value: unknown): value is RichText {
  const root = (value as RichText | null | undefined)?.root
  return Boolean(root?.children?.length)
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<JSX.Element> {
  const { locale, slug } = await params
  const typedLocale = asTypedLocale(locale)
  if (!typedLocale) notFound()
  const capability = await getCapabilityBySlug(slug, typedLocale)

  if (!capability) {
    notFound()
  }

  const hero = capability.heroSection
  const heroButton = hero?.button
  const heroEyebrow = hero?.badge || 'Capability'
  const heroHeading = hero?.heading || capability.title || 'Capability'

  const what = capability.whatThisMeansToUs
  const how = capability.howWeDoIt
  const proof = capability.caseStudies
  const related = capability.relatedCapabilities

  const whatItems = what?.items?.filter((item) => item.title || item.excerpt) ?? []
  const howItems = how?.items?.filter((item) => item.title || item.excerpt) ?? []
  const proofItems = proof?.items ?? []

  // Populated relationship docs only (depth 2 hydrates them to objects); drop self-references and
  // any unpopulated id strings that would have nothing to render.
  const relatedItems = (related?.capabilities ?? []).filter(
    (item): item is Capability => typeof item === 'object' && item !== null && item.id !== capability.id,
  )

  const cta = capability.cta

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-24 px-5 pb-24 md:px-8 lg:gap-32 lg:px-12 lg:pb-32">
      {/* ── HERO ─────────────────────────────────────────────────────────────────────────── */}
      <section className="w-full pt-10 lg:pt-16">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Motion
            className="flex flex-col items-start gap-7"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="text-[12px] uppercase tracking-[0.18em] text-subtle">{heroEyebrow}</span>

            <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-medium leading-[1.02] tracking-[-0.04em] text-cream">
              {heroHeading}
            </h1>

            {hasRichText(hero?.description) ? (
              <RichTextComp
                content={hero.description as RichText}
                className="max-w-2xl prose-p:mb-0 prose-p:text-[clamp(1rem,1.6vw,1.2rem)] prose-p:leading-relaxed prose-p:text-body"
              />
            ) : (
              capability.excerpts && (
                <p className="max-w-2xl text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed text-body">
                  {capability.excerpts}
                </p>
              )
            )}

            {heroButton?.label && (
              <Link
                href={heroButton.link || '/contact'}
                className={cn(
                  'mt-2 inline-flex items-center gap-2 rounded-md bg-cream px-6 py-3 text-[15px] font-medium text-ink transition-colors duration-300 hover:bg-cream-hover',
                  FOCUS_RING,
                )}
              >
                {heroButton.label}
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
            )}
          </Motion>

          {/* On-brand hero figure — the discipline's own line drawing (chosen by `animation`),
              rendered latent on a faint framed panel. `cap-stage` carries the CSS defaults so it
              draws correctly server-side without a pointer handler. Decorative → aria-hidden. */}
          {capability.animation && (
            <Motion
              className="cap-stage relative aspect-[520/440] w-full overflow-hidden rounded-md ring-1 ring-line"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
              aria-hidden
            >
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(120% 120% at 72% 24%, #16151b 0%, #0d0c11 52%, #08080b 100%)',
                }}
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-[url('/noise.svg')] bg-[length:240px] opacity-[0.12] mix-blend-overlay"
              />
              <div className="absolute inset-0 flex items-center justify-center p-6 lg:p-12">
                <CapabilityArt animation={capability.animation} />
              </div>
            </Motion>
          )}
        </div>
      </section>

      {/* ── SECTION 01 · WHAT IT IS (single definitional moment) ─────────────────────────── */}
      {what?.heading && (
        <section className="w-full">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            {/* Definition — text-forward left column */}
            <Motion className="flex flex-col gap-6" {...reveal}>
              <SectionMarker index={1} label={what.sectionLabel || 'What it is'} />
              <h2 className="max-w-xl font-display text-[clamp(1.75rem,3.4vw,2.375rem)] font-medium leading-[1.1] tracking-[-0.03em] text-cream whitespace-pre-line">
                {what.heading}
              </h2>
              {hasRichText(what.description) && (
                <RichTextComp
                  content={what.description as RichText}
                  className="max-w-xl prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-body"
                />
              )}
            </Motion>

            {/* Principles — quiet raised tiles: bg-ink + hairline, a faint per-item tonal wash and
                grain (the signature gradient-panel language at whisper volume), lifting on hover.
                The hover transform lives on an inner div so Motion's reveal transform (which stays
                inline on the wrapper) never fights the CSS translate. */}
            {whatItems.length > 0 && (
              <div className="flex flex-col gap-3">
                {whatItems.map((item, i) => {
                  const tone = toneFor(null, i)
                  return (
                    <Motion key={item.id ?? `means-${i}`} {...revealItem(i)}>
                      <div className="group relative overflow-hidden rounded-md border border-white/[0.07] bg-ink p-6 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-line-strong motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                        <span
                          aria-hidden
                          className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                          style={{
                            backgroundImage: `radial-gradient(120% 100% at 0% 0%, rgba(${TONE_RGB[tone]}, 0.11) 0%, transparent 58%)`,
                          }}
                        />
                        <span
                          aria-hidden
                          className="absolute inset-0 bg-[url('/noise.svg')] bg-[length:240px] opacity-[0.06] mix-blend-overlay"
                        />
                        <div className="relative flex flex-col gap-2">
                          <div className="flex items-baseline gap-3">
                            <span className="text-[12px] tabular-nums text-cream/70">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            {item.title && (
                              <h3 className="text-[16px] font-medium tracking-[-0.02em] text-cream">{item.title}</h3>
                            )}
                          </div>
                          {item.excerpt && (
                            <p className="pl-[27px] text-[14px] leading-relaxed text-body">{item.excerpt}</p>
                          )}
                        </div>
                      </div>
                    </Motion>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SECTION 02 · HOW WE DO IT (connected numbered sequence) ──────────────────────── */}
      {how?.heading && (
        <section className="relative w-full">
          {/* faint vertical rule field — the hub hero's quiet engineering texture, used exactly
              once on this page to break the longest run of black. Decorative, non-interactive. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-y-10 inset-x-0 opacity-50"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(244,243,236,0.02) 0 1px, transparent 1px 120px)',
            }}
          />
          <Motion className="relative mb-14 flex max-w-2xl flex-col gap-5" {...reveal}>
            <SectionMarker index={2} label={how.sectionLabel || 'How we do it'} />
            <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.375rem)] font-medium leading-[1.1] tracking-[-0.03em] text-cream whitespace-pre-line">
              {how.heading}
            </h2>
            {hasRichText(how.description) && (
              <RichTextComp
                content={how.description as RichText}
                className="prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-body"
              />
            )}
          </Motion>

          {howItems.length > 0 && (
            <NumberedSteps steps={howItems.map((item) => ({ title: item.title ?? '', body: item.excerpt ?? '' }))} />
          )}
        </section>
      )}

      {/* ── SECTION 03 · PROOF / SELECTED WORK (editorial rows) ──────────────────────────── */}
      {proof?.heading && (
        <section className="w-full">
          <Motion className="mb-12 flex max-w-2xl flex-col gap-5" {...reveal}>
            <SectionMarker index={3} label={proof.sectionLabel || 'Selected work'} />
            <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.375rem)] font-medium leading-[1.1] tracking-[-0.03em] text-cream whitespace-pre-line">
              {proof.heading}
            </h2>
            {hasRichText(proof.description) && (
              <RichTextComp
                content={proof.description as RichText}
                className="prose-p:text-[16px] prose-p:leading-relaxed prose-p:text-body"
              />
            )}
          </Motion>

          {proofItems.length > 0 && (
            <div className="flex flex-col">
              {proofItems.map((cs, i) => {
                // Result line: authored metric only. When no metric exists the whole line is
                // omitted — an absent result beats a placeholder, and we never invent a number.
                const result = [cs.metricValue, cs.metricLabel].filter(Boolean).join(' ')
                // Per-row brand accent, cycling the TONE palette so rows read as case cards.
                const tone = toneFor(null, i)

                return (
                  <Motion
                    tag="article"
                    key={cs.id ?? `case-${i}`}
                    className="grid grid-cols-1 gap-6 border-t border-line py-10 transition-colors duration-300 hover:bg-gradient-to-r hover:from-white/[0.02] hover:to-transparent lg:grid-cols-[0.85fr_2fr] lg:gap-12 lg:py-12"
                    {...revealItem(i)}
                  >
                    {/* left: meta + title */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2.5 text-[12px] uppercase tracking-[0.12em] text-subtle">
                        {/* slim gradient accent — a miniature of the brand gradient panel, with grain */}
                        <span aria-hidden className="relative h-3 w-3 shrink-0 overflow-hidden rounded-[3px]">
                          <span className="absolute inset-0" style={{ backgroundImage: TONE[tone] }} />
                          <span className="absolute inset-0 bg-[url('/noise.svg')] bg-[length:80px] opacity-20 mix-blend-overlay" />
                        </span>
                        <span className="text-cream/70">{cs.meta || '[Client]'}</span>
                      </div>
                      {cs.title && (
                        <h3 className="max-w-xs font-display text-[20px] font-medium leading-snug tracking-[-0.02em] text-cream">
                          {cs.title}
                        </h3>
                      )}
                    </div>

                    {/* right: Problem / Approach / Outcome + one result */}
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        {(
                          [
                            ['Problem', cs.problem],
                            ['Approach', cs.approach],
                            ['Outcome', cs.outcome],
                          ] as const
                        ).map(([label, richText]) => (
                          <div key={label} className="flex flex-col gap-2">
                            <span className="text-[11px] uppercase tracking-[0.14em] text-subtle">{label}</span>
                            {hasRichText(richText) ? (
                              <RichTextComp
                                content={richText as RichText}
                                className="prose-sm prose-p:text-[14px] prose-p:leading-relaxed prose-p:text-body"
                              />
                            ) : (
                              <p className="text-[14px] leading-relaxed text-subtle">[{label.toLowerCase()}]</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                        {result && (
                          <p className="text-[15px] font-medium tracking-[-0.02em] text-cream">
                            <span className="text-cream/70">Result — </span>
                            {result}
                          </p>
                        )}
                        {/* ml-auto keeps the link right-aligned even when no result line renders */}
                        <Link
                          href="/stories"
                          className={cn(
                            'group ml-auto inline-flex items-center gap-1.5 rounded-sm text-[13px] font-medium text-cream transition-colors duration-300 hover:text-cream/70',
                            FOCUS_RING,
                          )}
                        >
                          Read the story
                          <ArrowUpRight
                            size={14}
                            strokeWidth={2}
                            aria-hidden
                            className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          />
                        </Link>
                      </div>
                    </div>
                  </Motion>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── SECTION 04 · RELATED CAPABILITIES (slim strip) ──────────────────────────────── */}
      {related?.heading && relatedItems.length > 0 && (
        <section className="w-full">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[0.8fr_2.2fr] lg:gap-12">
            <Motion className="flex flex-col gap-4" {...reveal}>
              <SectionMarker index={4} label={related.sectionLabel || 'Related'} />
              <p className="max-w-xs font-display text-[clamp(1.25rem,2vw,1.5rem)] font-medium leading-tight tracking-[-0.02em] text-cream whitespace-pre-line">
                {related.heading}
              </p>
            </Motion>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {relatedItems.map((item, i) => (
                <Motion key={item.id ?? `related-${i}`} className="h-full" {...revealItem(i)}>
                  <Link
                    href={`/${typedLocale}/capabilities/${item.slug}`}
                    className={cn(
                      'group flex h-full flex-col gap-2 rounded-md border border-white/[0.07] bg-ink p-5 transition-colors duration-300 hover:border-white/[0.16]',
                      FOCUS_RING,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-medium tracking-[-0.02em] text-cream">{item.title}</h3>
                      <ArrowUpRight
                        size={14}
                        strokeWidth={2}
                        aria-hidden
                        className="shrink-0 text-subtle transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cream"
                      />
                    </div>
                    {item.excerpts && <p className="text-[13px] leading-relaxed text-subtle">{item.excerpts}</p>}
                  </Link>
                </Motion>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 05 · CLOSING CTA (calm, signature noise-gradient) ───────────────────── */}
      {cta?.heading && (
        <Motion
          tag="section"
          className="relative overflow-hidden rounded-md border border-white/[0.06] p-10 lg:p-16"
          {...reveal}
        >
          <span aria-hidden className="absolute inset-0">
            <span
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(135% 135% at 22% 18%, #6d3bd6 0%, #3a1c8c 46%, #1a1448 100%)',
              }}
            />
            <span className="absolute inset-0 bg-[url('/noise.svg')] bg-[length:240px] opacity-[0.16] mix-blend-overlay" />
            <span className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/45" />
          </span>

          <div className="relative z-10 flex flex-col items-center gap-8 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
            <div className="flex max-w-2xl flex-col items-center gap-3 lg:items-start lg:text-left">
              <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-cream">
                {cta.heading}
              </h2>
              {hasRichText(cta.description) && (
                <RichTextComp
                  content={cta.description as RichText}
                  className="max-w-lg prose-p:mb-0 prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-cream/75"
                />
              )}
            </div>
            {(cta.button_1?.label || cta.button_2?.label) && (
              <div className="flex w-full shrink-0 flex-col items-center gap-3 sm:w-auto sm:flex-row lg:ml-auto">
                {cta.button_1?.label && (
                  <Link
                    href={cta.button_1.link || '/contact'}
                    className={cn(
                      'inline-flex w-full items-center justify-center gap-2 rounded-md bg-cream px-6 py-3 text-[15px] font-medium text-ink transition-colors duration-300 hover:bg-cream-hover sm:w-auto',
                      FOCUS_RING,
                    )}
                  >
                    {cta.button_1.label}
                    <ArrowRight size={16} strokeWidth={2} aria-hidden />
                  </Link>
                )}
                {cta.button_2?.label && (
                  <Link
                    href={cta.button_2.link || '/case-studies'}
                    className={cn(
                      'inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-white/[0.06] px-6 py-3 text-[15px] font-medium text-cream transition-colors duration-300 hover:bg-white/[0.12] sm:w-auto',
                      FOCUS_RING,
                    )}
                  >
                    {cta.button_2.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </Motion>
      )}
    </div>
  )
}
