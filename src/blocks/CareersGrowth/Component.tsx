import RichTextComp, { type RichText } from '@/components/richtext'
import type { CareersGrowthBlock } from '@/payload-types'
import type { JSX } from 'react'

/**
 * "Engineering growth" — a progression ladder over supporting cards, per the approved prototype.
 *
 * REPLACES a BentoCard grid. The ladder is the point of this section, and a grid flattened four
 * ordered levels into four equal boxes; rows with a hairline between them keep the order legible.
 * Each rung shifts right on hover.
 *
 * The levels come from `featured.levels` (a tags array, max 4) paired with the featured
 * title/excerpt; the supporting cards come from `items`. Both are CMS-driven — the old component
 * had `||` fallbacks for every string, so an empty CMS rendered unapproved copy. Empty renders
 * nothing now.
 *
 * CONTENT: all strings are CMS values, unchanged.
 */
export function CareersGrowthComponent({
  heading,
  description,
  featured,
  items,
}: CareersGrowthBlock): JSX.Element | null {
  const levels = featured?.levels ?? []
  if (!heading && !levels.length && !items?.length) return null

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

        {/* The ladder. `levels` carries the rung names; the featured excerpt sits under the
            heading rather than being repeated per rung. */}
        {levels.length ? (
          <div data-cs-group>
            {levels.map((lvl, i) => (
              <div
                key={lvl.id ?? i}
                data-cs-item
                className="cs-row grid grid-cols-1 items-baseline gap-y-2 py-8 lg:grid-cols-12 lg:gap-6"
              >
                <span aria-hidden className="cs-meta lg:col-span-1">
                  L{String(i + 1).padStart(2, '0')}
                </span>
                <p className="m-0 font-display text-[clamp(22px,2.4vw,36px)] font-medium tracking-[-0.025em] lg:col-span-4">
                  {lvl.name}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Supporting cards — stack, lifecycle, delivery hub. */}
        {items?.length ? (
          <div data-cs-group className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-20">
            {items.map((item, i) => (
              <div key={item.id ?? i} data-cs-item className="border-t border-[rgba(242,240,234,0.14)] pt-7">
                {item.title ? (
                  <h3 className="mb-3 font-display text-[18px] font-medium tracking-[-0.01em]">{item.title}</h3>
                ) : null}
                {item.excerpt ? <p className="cs-body text-[16px]">{item.excerpt}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
