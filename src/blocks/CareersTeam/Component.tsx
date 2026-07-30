import RichTextComp, { type RichText } from '@/components/richtext'
import type { CareersTeamBlock, Media, Team } from '@/payload-types'
import { sortByTeamOrder } from '@/utilities/teamOrder'
import Image from 'next/image'
import type { JSX } from 'react'

/**
 * "Team voices" — a horizontal rail of real people, per the approved prototype.
 *
 * THE QUOTES COME FROM THE CMS, NOT FROM THE PROTOTYPE. That mockup carried three invented
 * quotes against "[ Engineer name ]" placeholders, with its own note to replace them. Each card
 * renders the member's own `excerpt`, and a member without one renders portrait, name and role
 * with no quote — nothing is written on anyone's behalf.
 *
 * Portraits are the real `image` relation, desaturated to hold the monochrome palette. The
 * prototype's purple portrait gradients are gone; a member with no image gets a plain dark panel.
 *
 * The old component defaulted the heading and description to hardcoded strings when the CMS was
 * empty; those are removed, as elsewhere on this page.
 *
 * Rows keep the global manual roster order, unchanged.
 */
export function CareersTeamComponent({ heading, description, members }: CareersTeamBlock): JSX.Element | null {
  const people = sortByTeamOrder(
    (members ?? []).flatMap((row) =>
      row?.member && typeof row.member === 'object'
        ? [{ team: row.member as Team, wide: row.wide !== false, _order: (row.member as Team)._order }]
        : [],
    ),
  )

  if (!heading && !people.length) return null

  return (
    <section className="pb-28 lg:pb-[130px]">
      <div className="cs-wrap">
        <div className="mb-14 max-w-[54ch] lg:mb-16">
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

        {people.length ? (
          <div data-cs-group className="cs-rail">
            {people.map(({ team }, i) => {
              const img = team.image as Media | undefined
              return (
                <article key={team.id ?? i} data-cs-item className="cs-vcard">
                  <div className="cs-portrait">
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt ?? team.name ?? ''}
                        width={420}
                        height={525}
                        sizes="(max-width: 899px) 80vw, 30vw"
                      />
                    ) : null}
                  </div>
                  {team.excerpt ? (
                    <p className="mt-6 mb-3.5 text-[clamp(16px,1.4vw,21px)] leading-[1.4] tracking-[-0.012em]">
                      {team.excerpt}
                    </p>
                  ) : null}
                  {team.name ? <p className="m-0 font-medium">{team.name}</p> : null}
                  {team.position ? <p className="cs-meta mt-1">{team.position}</p> : null}
                </article>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}
