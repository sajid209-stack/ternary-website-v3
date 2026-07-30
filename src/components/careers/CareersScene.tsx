'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Fragment, useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import './careersScene.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * The careers page as one scroll-driven scene.
 *
 * Motion follows the approved prototype — masked headings, rows rising, covers wiping open from
 * the bottom, a drifting hero field, filter-driven role list. The prototype loaded GSAP, Lenis
 * and Anime.js from CDNs; all three are already local dependencies here, so nothing is fetched
 * at runtime.
 *
 * SSR CONTRACT. Nothing is hidden in CSS or markup — every start state is written by gsap.from()
 * when its trigger is built, so the server HTML is the finished page. The current careers page
 * ships 39 elements at inline opacity:0 (the shared <Motion initial={{opacity:0}}> defect) and is
 * largely blank without JavaScript; that cannot happen here.
 *
 * GATING. Under prefers-reduced-motion or the site's A11yFab toggle no context is built and Lenis
 * never starts. gsap.matchMedia handles the rest.
 */
export default function CareersScene({ children }: { children: ReactNode }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const reduce =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.getAttribute('data-a11y-motion') === 'reduce'
    if (reduce) return

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t: number): void => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const q = <T extends Element = HTMLElement>(s: string): T[] => [...root.querySelectorAll<T>(s)]

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899px)' }, (context) => {
        const { wide } = context.conditions as { wide: boolean; narrow: boolean }

        // Section headings rise out of their own clipped line box.
        for (const el of q('[data-cs="mask"]')) {
          gsap.from(el, {
            yPercent: 112,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 95%', once: true },
          })
        }

        // Rows, cards and rungs.
        for (const group of q('[data-cs-group]')) {
          const kids = [...group.querySelectorAll<HTMLElement>('[data-cs-item]')]
          if (!kids.length) continue
          gsap.from(kids, {
            opacity: 0,
            y: wide ? 30 : 18,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: group, start: 'top 88%', once: true },
          })
        }

        // Covers wipe open from the bottom rather than fading.
        for (const el of q('[data-cs="cover"]')) {
          gsap.fromTo(
            el,
            { clipPath: 'inset(0 0 100% 0)' },
            {
              clipPath: 'inset(0 0 0% 0)',
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            },
          )
        }

        // The hero field drifts slowly and leans to the cursor. Monochrome — the prototype's
        // purple signal streaks are replaced by a single green marker on the roles list, which
        // is the page's one accent.
        const field = root.querySelector<SVGSVGElement>('[data-cs="field"]')
        if (field) {
          gsap.to(field, {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: field, start: 'top top', end: 'bottom top', scrub: true },
          })
          if (wide && window.matchMedia('(hover: hover)').matches) {
            const xTo = gsap.quickTo(field, 'x', { duration: 1.4, ease: 'power3' })
            const yTo = gsap.quickTo(field, 'y', { duration: 1.4, ease: 'power3' })
            const onMove = (e: PointerEvent): void => {
              xTo((e.clientX / window.innerWidth - 0.5) * 22)
              yTo((e.clientY / window.innerHeight - 0.5) * 14)
            }
            window.addEventListener('pointermove', onMove, { passive: true })
            context.add?.(() => window.removeEventListener('pointermove', onMove))
          }
        }
      })
    }, root)

    const refresh = (): void => ScrollTrigger.refresh()
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    fonts?.ready.then(refresh).catch(() => {})
    const t = window.setTimeout(refresh, 900)

    return () => {
      window.clearTimeout(t)
      gsap.ticker.remove(tick)
      lenis.destroy()
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [])

  return (
    <div ref={ref} className="cs">
      {children}
    </div>
  )
}

/**
 * The hero headline, split into 3D character blocks.
 *
 * Only the front face is a real text node; the two back faces are CSS generated content driven by
 * data-ch. Rendering all three as spans tripled the headline's textContent on the About hero,
 * which broke selection, copy-paste and the page's own <h1> for crawlers.
 *
 * Server-rendered plain, split after mount, and only on Latin locales — per-character splitting
 * breaks grapheme clusters and conjunct shaping in Bengali.
 */
export function CareersHeroHeadline({
  lines,
  locale,
}: {
  lines: string[]
  locale?: string
}): JSX.Element {
  const [split, setSplit] = useState(false)

  useEffect(() => {
    if (locale !== 'en') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (document.documentElement.getAttribute('data-a11y-motion') === 'reduce') return
    // Deferred a frame so the plain headline paints first and setState is not synchronous in the
    // effect body.
    const id = requestAnimationFrame(() => setSplit(true))
    return () => cancelAnimationFrame(id)
  }, [locale])

  useEffect(() => {
    if (!split) return
    const chars = document.querySelectorAll<HTMLElement>('.cs-hero .cs-char')
    if (!chars.length) return
    const anim = gsap.fromTo(
      chars,
      { rotateX: -90, opacity: 0 },
      { rotateX: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.034, delay: 0.18 },
    )
    return () => {
      anim.kill()
    }
  }, [split])

  if (!split) {
    return (
      <>
        {lines.map((line, i) => (
          <span key={i} className="cs-line">
            {line}
          </span>
        ))}
      </>
    )
  }

  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className="cs-line">
          {line.split(' ').map((word, w, arr) => (
            <Fragment key={w}>
              <span className="cs-word">
                {[...word].map((ch, c) => (
                  <span key={c} className="cs-char" data-ch={ch}>
                    <span>{ch}</span>
                  </span>
                ))}
              </span>
              {/* A real space, and a sibling of the word wrapper — inside it, a trailing space is
                  trimmed by the inline-block and the words render jammed together. */}
              {w < arr.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </span>
      ))}
    </>
  )
}
