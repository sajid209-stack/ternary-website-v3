import RichTextComp, { type RichText } from '@/components/richtext'
import type { CareersGridTwoBlock } from '@/payload-types'
import type { JSX } from 'react'

/**
 * "What you can expect" — three columns, each opening with a cover, per the approved prototype.
 *
 * REPLACES a BentoCard grid plus a separate mobile carousel. Same treatment as the row list
 * above: a hairline over each column, the cover wiping open from the bottom, and the columns
 * stacking on narrow screens rather than becoming a horizontal scroller.
 *
 * ALSO REMOVES hardcoded fallback copy. Every field had an `||` default, and two of them were
 * the *same* placeholder ("Genuine Connection", twice), so an empty CMS rendered duplicated,
 * unapproved marketing text. Empty fields now render nothing.
 *
 * Covers are a monochrome ramp, not the prototype's #4C1D95 → #C026D3 violets.
 *
 * CONTENT: heading, description and each card's title/excerpt are CMS strings, unchanged.
 */
export function CareersGridTwoComponent({ heading, description, items }: CareersGridTwoBlock): JSX.Element | null {
  if (!heading && !items?.length) return null

  return (
    <section className="pb-28 lg:pb-32">
      <div className="cs-wrap">
        <div className="mb-14 max-w-[52ch] lg:mb-[70px]">
          {heading ? (
            <h2 className="cs-h2 mb-5">
              <span data-cs="mask" className="cs-mask">
                {heading}
              </span>
            </h2>
          ) : null}
          {description ? (
            <div className="cs-body">
              <RichTextComp content={description as RichText} className="prose-p:mb-0 prose-p:text-inherit" />
            </div>
          ) : null}
        </div>

        <div data-cs-group className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-6">
          {(items ?? []).map((item, i) => (
            <div key={item.id ?? i} data-cs-item className="cs-item border-t border-[rgba(242,240,234,0.14)] pt-7">
              <span
                aria-hidden
                data-cs="cover"
                className={`cs-cover cs-cover-${(i % 5) + 1} mb-6 block aspect-[16/9]`}
              />
              <span aria-hidden className="cs-meta">
                {String(i + 1).padStart(2, '0')}
              </span>
              {item.title ? (
                <h3 className="mt-5 mb-3 font-display text-[clamp(19px,1.7vw,25px)] font-medium tracking-[-0.015em]">
                  {item.title}
                </h3>
              ) : null}
              {item.excerpt ? <p className="cs-body text-[16px]">{item.excerpt}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
