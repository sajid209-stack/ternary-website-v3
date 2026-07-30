import { CareersHeroHeadline } from '@/components/careers/CareersScene'
import RichTextComp, { type RichText } from '@/components/richtext'
import type { CareersHeroBlock } from '@/payload-types'
import type { JSX } from 'react'

/**
 * Careers hero — the editorial opening from the approved prototype.
 *
 * REPLACES a two-column intro whose right half was a teal gradient panel: the CMS image was
 * layered at 60% over a `radial-gradient(#2f9d8a → #0a2d28)` fallback, so with no S3 media it was
 * a solid teal block. Same placeholder pattern removed from About.
 *
 * The headline is now split into 3D character blocks and flipped up once on load (Latin locales
 * only — see CareersHeroHeadline), over a monochrome technical field that drifts on scroll and
 * leans to the cursor.
 *
 * PALETTE DIFFERS FROM THE PROTOTYPE, deliberately. That mockup put a purple glow
 * (rgba(124,58,237,.55)) behind the hero and violet signal streaks across the grid. Purple is
 * ruled out here, so the field is grey on black and the one green accent is spent on the roles
 * list, where it marks the active row.
 *
 * The heading is a plain text field and carries no markup; the two lines come from a newline. A
 * single-line heading simply renders as one line.
 *
 * CONTENT: heading, description and the button label are CMS strings, unchanged.
 */
export function CareersHeroComponent(
  props: CareersHeroBlock & { locale?: string },
): JSX.Element | null {
  const { heading, description, buttons, locale } = props
  if (!heading && !description) return null

  const lines = (heading ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
  const button = buttons?.[0]

  // An irregular column rhythm on purpose — an even grid reads as background texture and
  // disappears; uneven spacing makes it read as a drawing.
  const cols = [4, 12, 21, 33, 39, 52, 61, 74, 83, 88, 96]
  const rows = [18, 34, 52, 71, 86]

  return (
    <section
      className="cs-hero relative isolate flex min-h-[92svh] items-center overflow-hidden py-28 lg:py-32"
    >
      <svg
        aria-hidden
        data-cs="field"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full [mask-image:radial-gradient(115%_90%_at_30%_35%,#000_0%,rgba(0,0,0,0.4)_58%,transparent_88%)]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        {cols.map((x) => (
          <line
            key={`c${x}`}
            x1={x}
            y1="0"
            x2={x}
            y2="100"
            stroke="rgba(242,240,234,0.07)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {rows.map((y) => (
          <line
            key={`r${y}`}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="rgba(242,240,234,0.07)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="cs-wrap">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end lg:gap-6">
          <h1 className="cs-h1 lg:col-span-8">
            <CareersHeroHeadline lines={lines.length ? lines : [heading ?? '']} locale={locale} />
          </h1>

          <div className="lg:col-span-3 lg:col-start-10">
            {description ? (
              <div className="cs-body mb-7">
                <RichTextComp content={description as RichText} className="prose-p:mb-0 prose-p:text-inherit" />
              </div>
            ) : null}
            {button?.label ? (
              <a
                href={button.url || '#open-roles'}
                className="cs-meta inline-flex items-center gap-2.5 bg-[#f2f0ea] px-6 py-4 !text-[#050505] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2f0ea] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
              >
                {button.label} →
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
