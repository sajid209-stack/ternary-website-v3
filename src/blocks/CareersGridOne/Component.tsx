import RichTextComp, { type RichText } from '@/components/richtext'
import type { CareersGridOneBlock } from '@/payload-types'
import type { JSX } from 'react'

/**
 * "How we work" — a numbered row list, per the approved prototype.
 *
 * REPLACES a six-cell bento of BentoCards, one of which carried a spinning orbital graphic.
 * Rows separated by hairlines read as a set of positions being stated; cards read as a set of
 * products. Each row carries a cover that wipes open from the bottom as it enters, and the row
 * shifts right on hover.
 *
 * ALSO REMOVES a large block of hardcoded fallback copy. Every string in the old component had
 * an `||` default ("More than just a workplace. A platform for impact.", five card bodies), so
 * the page silently rendered invented marketing copy whenever the CMS was empty — copy nobody
 * had approved and which never appeared in the changelog. Empty fields now render nothing.
 *
 * The prototype's covers were purple radial gradients (#3B1D6E → #C026D3); those are a grey ramp
 * here, since purple is ruled out. Depth comes from luminance, not hue.
 *
 * CONTENT: heading, description and each card's title/excerpt are CMS strings, unchanged.
 */
export function CareersGridOneComponent({ heading, description, items }: CareersGridOneBlock): JSX.Element | null {
  if (!heading && !items?.length) return null

  return (
    <section className="py-28 lg:py-32">
      <div className="cs-wrap">
        <div className="mb-16 grid grid-cols-1 gap-6 lg:mb-20 lg:grid-cols-12">
          {heading ? (
            <h2 className="cs-h2 lg:col-span-6">
              <span data-cs="mask" className="cs-mask">
                {heading}
              </span>
            </h2>
          ) : null}
          {description ? (
            <div className="cs-body self-end lg:col-span-5 lg:col-start-8">
              <RichTextComp content={description as RichText} className="prose-p:mb-0 prose-p:text-inherit" />
            </div>
          ) : null}
        </div>

        <div data-cs-group>
          {(items ?? []).map((item, i) => (
            <div
              key={item.id ?? i}
              data-cs-item
              className="cs-row grid grid-cols-1 items-start gap-y-4 py-11 lg:grid-cols-12 lg:gap-6"
            >
              <span aria-hidden className="cs-meta pt-2 lg:col-span-1">
                {String(i + 1).padStart(2, '0')}
              </span>
              {item.title ? (
                <h3 className="font-display text-[clamp(21px,2.2vw,32px)] leading-[1.08] font-medium tracking-[-0.02em] lg:col-span-4">
                  {item.title}
                </h3>
              ) : null}
              {item.excerpt ? <p className="cs-body lg:col-span-3 lg:col-start-7">{item.excerpt}</p> : null}
              <span
                aria-hidden
                data-cs="cover"
                className={`cs-cover cs-cover-${(i % 5) + 1} mt-3 block aspect-[16/10] lg:col-span-3 lg:col-start-10 lg:mt-0`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
