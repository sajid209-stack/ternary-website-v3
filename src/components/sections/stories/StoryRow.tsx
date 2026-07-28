'use client'

import Link from '@/components/LocalizedLink'
import { cn } from '@/lib/utils'
import type { FeedItem } from '@/lib/stories/feedTypes'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, type JSX } from 'react'

/**
 * One feed row: title on the left, media on the right, and deliberately nothing in between.
 *
 * The row is a list, not a card in a grid — which is the point. A row has no neighbours competing
 * for height, so a title that wraps to three lines simply makes its own row taller. There is
 * nothing to equalise and nothing to break, which is what a mixed feed of press releases, case
 * studies and essays needs.
 *
 * Content is restricted to title / eyebrow / date. No dek, no reference code, no read time, no
 * "Read →" — the whole row is the link, so a call to action inside it would be redundant.
 */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Silent looping thumbnail that only plays while it is on screen. */
function RowVideo({ url, poster }: { url: string; poster: string | null }): JSX.Element {
  const ref = useRef<HTMLVideoElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Under prefers-reduced-motion the poster is the whole experience — play() is never called.
    if (reduceMotion) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // A rejected play() is normal here (autoplay policy, or the element scrolled away before
          // the promise settled) and is not actionable — swallow it rather than log noise.
          void el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { rootMargin: '100px' },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      el.pause()
    }
  }, [reduceMotion])

  return (
    <video
      ref={ref}
      src={url}
      poster={poster ?? undefined}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      className="absolute inset-0 size-full object-cover"
    />
  )
}

export default function StoryRow({ item, index }: { item: FeedItem; index: number }): JSX.Element {
  const reduceMotion = useReducedMotion()

  // The frame renders whether or not the item has media: most of the feed has no thumbnail yet, and
  // dropping the frame would let those rows collapse onto the title column and lose the list's
  // rhythm. Empty, it is just the dark surface token — a deliberate blank, not a gap.
  const media = (
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-ink ring-1 ring-white/5">
      {item.media && (
        <motion.div
          className="absolute inset-0"
          variants={{ rest: { scale: 1 }, hover: { scale: reduceMotion ? 1 : 1.03 } }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {item.media.isVideo ? (
            <RowVideo url={item.media.url} poster={item.media.poster} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- matches the surrounding stories
            // surfaces, which serve already-sized S3 media rather than routing through next/image.
            <img src={item.media.url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
          )}
        </motion.div>
      )}
    </div>
  )

  const body = (
    <>
      {/* Media sits above the title below md, and to the right from md up. `order` moves it without
          duplicating the markup. */}
      <div className="order-1 md:order-2 md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">{media}</div>

      <div className="order-2 flex flex-col md:order-1 md:col-span-6 md:col-start-1 lg:col-span-5">
        <motion.h3
          className="font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.03em] text-cream"
          variants={{ rest: { color: 'var(--color-cream)' }, hover: { color: 'var(--color-cream-hover)' } }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {item.title}
          {item.isExternal && (
            <span aria-hidden className="ml-2 inline-block align-baseline">
              ↗
            </span>
          )}
        </motion.h3>

        <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.14em] text-subtle">{item.eyebrow}</p>
        <p className="mt-2 font-mono text-[12px] tabular-nums tracking-[0.02em] text-subtle">{item.date}</p>
      </div>
    </>
  )

  const gridClass = 'grid grid-cols-1 items-start gap-6 md:grid-cols-12 md:gap-8'
  const linkClass = cn(
    gridClass,
    'rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream',
  )

  return (
    <motion.li
      className="border-t border-line"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: EASE, delay: Math.min(index * 0.06, 0.36) }}
    >
      <motion.div initial="rest" whileHover="hover" whileFocus="hover" animate="rest" className="py-10 lg:py-14">
        {item.isExternal ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title} (opens in new tab)`}
            className={linkClass}
          >
            {body}
          </a>
        ) : (
          <Link href={item.href} className={linkClass}>
            {body}
          </Link>
        )}
      </motion.div>
    </motion.li>
  )
}
