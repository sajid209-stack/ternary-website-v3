'use client'

import Link from '@/components/LocalizedLink'
import { useEffect, useRef, useState, type JSX } from 'react'

/**
 * /work — one case study per viewport, snapped.
 *
 * The scroll choreography lives in CSS (`workScenes.css`); this component only decides which
 * scene is "live" and keeps the rail in step. Every reveal's base rule describes the FINISHED
 * state, so a reader who never runs the JS — or who has reduced motion on — still sees complete
 * scenes rather than empty ones.
 */

export interface WorkScene {
  id: string
  href: string
  /** Client name, taken from the story title's "Client: Subject" form. */
  client: string
  /** Subject, the other half of that title. */
  subject: string
  /** Two authored lines; the second renders in the muted italic. */
  headline: [string, string]
  line: string
  media: { url: string; isVideo: boolean; poster: string | null } | null
  /** Fallback wash when a story has no media yet. */
  toneClass: string
}

/** Silent looping scene video — plays only while its scene holds the screen. */
function SceneVideo({
  url,
  poster,
  live,
  reduceMotion,
}: {
  url: string
  poster: string | null
  live: boolean
  reduceMotion: boolean
}): JSX.Element {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Under prefers-reduced-motion the poster is the whole experience — play() is never called.
    if (reduceMotion) return
    if (live) {
      // Rejection is routine here (autoplay policy, or the scene left the screen before the
      // promise settled) and is not actionable.
      void el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [live, reduceMotion])

  return <video ref={ref} src={url} poster={poster ?? undefined} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} />
}

export default function WorkScenes({ scenes }: { scenes: WorkScene[] }): JSX.Element {
  const [current, setCurrent] = useState(0)
  const [hintGone, setHintGone] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const sceneRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduceMotion(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])

  // A scene goes live once it owns most of the screen.
  useEffect(() => {
    const nodes = sceneRefs.current.filter((node): node is HTMLElement => node !== null)
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio <= 0.55) continue
          const index = nodes.indexOf(entry.target as HTMLElement)
          if (index === -1) continue
          setCurrent(index)
          if (index > 0) setHintGone(true)
        }
      },
      { threshold: [0, 0.55, 0.9] },
    )

    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [scenes.length])

  const goTo = (index: number) => {
    sceneRefs.current[index]?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  // Arrow / page keys move a whole scene at a time, matching what the wheel does.
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowDown' || event.key === 'PageDown' ? 1 : event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 0
    if (step === 0) return
    const next = current + step
    if (next < 0 || next >= scenes.length) return
    event.preventDefault()
    goTo(next)
  }

  return (
    <>
      <nav className="wk-rail" aria-label="Case studies">
        {scenes.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            aria-current={index === current}
            aria-label={`Go to ${scene.client}`}
            onClick={() => goTo(index)}
          />
        ))}
      </nav>

      <p className="wk-hint" data-gone={hintGone}>
        Scroll
      </p>

      {/* tabIndex makes the track focusable so the arrow-key handler is reachable by keyboard. */}
      <div className="wk-track" onKeyDown={onKeyDown} tabIndex={-1}>
        {scenes.map((scene, index) => (
          <section
            key={scene.id}
            ref={(node) => {
              sceneRefs.current[index] = node
            }}
            className={`wk-scene${index === current ? ' is-live' : ''}`}
          >
            <div className="wk-media" aria-hidden>
              <div className={`wk-fill ${scene.media ? '' : scene.toneClass}`}>
                {scene.media &&
                  (scene.media.isVideo ? (
                    <SceneVideo
                      url={scene.media.url}
                      poster={scene.media.poster}
                      live={index === current}
                      reduceMotion={reduceMotion}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- full-bleed S3 media,
                    // matching the other stories surfaces rather than routing through next/image.
                    <img src={scene.media.url} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
                  ))}
              </div>
            </div>

            <div className="wk-body">
              <p className="wk-eyebrow">
                <span>
                  {String(index + 1).padStart(2, '0')} — {scene.client}
                </span>
                <span className="wk-tick" aria-hidden />
                <span>{scene.subject}</span>
              </p>

              <h2 className="wk-title">
                <span className="wk-mask">
                  <span>{scene.headline[0]}</span>
                </span>
                <span className="wk-mask">
                  <span>
                    <em>{scene.headline[1]}</em>
                  </span>
                </span>
              </h2>

              <div className="wk-foot">
                <p className="wk-line">{scene.line}</p>
                <Link className="wk-link" href={scene.href}>
                  Read the story →
                </Link>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
