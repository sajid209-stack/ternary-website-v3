import RolesList from '@/components/careers/RolesList'
import RichTextComp, { type RichText } from '@/components/richtext'
import { getJobs, type JobListing } from '@/lib/jobs-data'
import type { JobsBlockType } from '@/payload-types'
import type { JSX } from 'react'

/**
 * "Open roles" — the editorial role archive from the approved prototype.
 *
 * Listings still come from the live recruiting API via `getJobs()`. A null `jobs` prop drives the
 * error state; an empty array is the valid "no open roles" state — a fetch failure and an empty
 * board must not read the same.
 *
 * The heading, description and the roles themselves stay server-rendered; only the filter
 * interaction is a client component, so the listings are in the HTML for crawlers and for anyone
 * without JavaScript.
 *
 * `jobsBlock` is used on the careers page only, so restyling it here reaches nothing else.
 *
 * The hero CTA targets `#open-roles`; the scroll-margin keeps the heading clear of the sticky
 * header when jumped to.
 */
export async function JobsBlockComponent({ heading, description }: JobsBlockType): Promise<JSX.Element> {
  let jobs: JobListing[] | null
  try {
    jobs = await getJobs()
  } catch {
    jobs = null
  }

  return (
    <section id="open-roles" className="scroll-mt-24 pb-32 lg:pb-[150px]">
      <div className="cs-wrap">
        <div className="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-12">
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

        <RolesList jobs={jobs} />
      </div>
    </section>
  )
}
