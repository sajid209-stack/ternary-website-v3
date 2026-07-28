import WorkScenes, { type WorkScene } from '@/components/work/WorkScenes'
import '@/components/work/workScenes.css'
import { asTypedLocale } from '@/lib/i18n/locales'
import { generateMeta } from '@/lib/seo/generateMeta'
import config from '@/payload.config'
import type { Media, Story } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { getPayload, type TypedLocale } from 'payload'
import type { JSX } from 'react'

/**
 * /work — the case-study reel: one study per viewport, snapped.
 *
 * Distinct from /stories, which is the mixed feed of case studies, press releases and insights.
 * This page is case studies only, and is meant to be moved through rather than scanned.
 *
 * Order is the `sortWeight` the story collection already carries, so the reel is curated from the
 * same place as the feed. Every scene is built from approved CMS copy — there is no hardcoded
 * content here.
 */

// Washes standing in for media on a story that has none yet, cycling so neighbours differ.
const TONES = ['wk-t1', 'wk-t2', 'wk-t3', 'wk-t4', 'wk-t5', 'wk-t6'] as const

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const typedLocale = asTypedLocale(locale)
  if (!typedLocale) return {}
  return generateMeta({
    doc: null,
    fallbackTitle: 'Work',
    fallbackDescription: 'Systems Ternary designed, built, and still runs.',
    pathname: '/work',
    locale: typedLocale,
  })
}

function asMedia(value: unknown): Media | null {
  return value && typeof value === 'object' ? (value as Media) : null
}

/**
 * Story titles are authored as "Client: Subject", which is what the eyebrow's two halves are. A
 * title without a colon keeps its whole self on the left and falls back to the engagement.
 */
function splitTitle(title: string, engagement: string): { client: string; subject: string } {
  const at = title.indexOf(':')
  if (at === -1) return { client: title, subject: engagement }
  return { client: title.slice(0, at).trim(), subject: title.slice(at + 1).trim() }
}

/**
 * The authored two-line headline. Falls back to splitting the title so a story that has not been
 * given scene copy still renders a complete scene rather than an empty one.
 */
function splitHeadline(headline: string | null | undefined, fallback: { client: string; subject: string }): [string, string] {
  const lines = (headline ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length >= 2) return [lines[0], lines[1]]
  if (lines.length === 1) return [lines[0], '']
  return [fallback.client, fallback.subject]
}

async function fetchScenes(locale: TypedLocale): Promise<WorkScene[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'story',
    limit: 100,
    depth: 1,
    locale,
    // Published only. Omitting `draft` does NOT filter drafts out — Payload v3 keeps them in the
    // same collection under `_status: 'draft'`, so without this an unpublished study appears on a
    // public page. Verified: flex5 and hissho-sushiops360 were both showing.
    where: { _status: { equals: 'published' } },
    // `-sortWeight` is the curated order the feed uses. Nothing carries a weight yet, so the
    // second key is what actually orders the reel today — without it the order is arbitrary and
    // the least-finished study can land in the opening scene.
    sort: ['-sortWeight', '-createdAt'],
  })

  return (result.docs as Story[])
    .filter((doc) => Boolean(doc.slug))
    .map((doc, index): WorkScene => {
      const engagement = doc.caseMeta?.engagement ?? ''
      const parts = splitTitle(doc.title ?? 'Untitled', engagement)
      const thumb = asMedia(doc.thumbnail)
      const url = thumb ? getMediaUrl(thumb.url, thumb.updatedAt) : ''
      const poster = asMedia(doc.posterImage)

      return {
        id: doc.id,
        href: `/case-studies/${doc.slug}`,
        client: parts.client,
        subject: parts.subject,
        headline: splitHeadline(doc.workHeadline, parts),
        line: doc.excerpts ?? '',
        media: url
          ? {
              url,
              isVideo: typeof thumb?.mimeType === 'string' && thumb.mimeType.startsWith('video/'),
              poster: poster ? getMediaUrl(poster.url, poster.updatedAt) || null : null,
            }
          : null,
        toneClass: TONES[index % TONES.length],
      }
    })
}

/** Tag-busted by the story collection's existing afterChange / afterDelete hooks. */
function getScenes(locale: TypedLocale): Promise<WorkScene[]> {
  return unstable_cache(() => fetchScenes(locale), [`work_scenes_${locale}_v3`], { tags: ['story'] })()
}

export default async function WorkPage({ params }: { params: Promise<{ locale: string }> }): Promise<JSX.Element> {
  const { locale } = await params
  const typedLocale = asTypedLocale(locale)
  if (!typedLocale) notFound()

  const scenes = await getScenes(typedLocale)

  return (
    <>
      {/* The scenes are h2s, so the page still needs its single h1. It is visually hidden because
          the design gives the page no heading of its own — the first scene fills the viewport. */}
      <h1 className="sr-only">Work</h1>
      <WorkScenes scenes={scenes} />
    </>
  )
}
