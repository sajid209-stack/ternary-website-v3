'use client'

import type { JobListing } from '@/lib/jobs-data'
import Link from 'next/link'
import { useMemo, useState, type JSX } from 'react'

/**
 * The open-roles list with department filters, per the approved prototype.
 *
 * FED BY THE LIVE RECRUITING API, not hardcoded. The prototype listed four roles inline
 * (Business Analyst, Software Engineer, Senior Frontend Engineer, Product Designer) as a mockup;
 * the real listings already come from `getJobs()` against RECRUIT_API_BASE, and three of those
 * four are live today. Hardcoding them would have frozen a snapshot of someone else's system.
 *
 * FILTERS ARE DERIVED, NOT FIXED. The prototype hardcoded Engineering / Delivery / Design chips.
 * Those are built here from the departments actually present in the response, so a new department
 * appears on its own and an empty one never renders a chip that filters to nothing.
 *
 * The prototype used Anime.js `createLayout` for a FLIP transition between filter states. This
 * uses plain conditional rendering: FLIP on a list whose rows change height needs every row
 * measured before and after, and the payoff — a slide rather than a swap — is not worth a second
 * animation library reaching into a list that must stay keyboard- and screen-reader-legible. The
 * count is announced politely so filtering is not a silent change.
 *
 * No reduced-opacity text and no colour-only state: the active chip is a solid fill, so it reads
 * without relying on the green.
 */
export default function RolesList({ jobs }: { jobs: JobListing[] | null }): JSX.Element {
  const [dept, setDept] = useState<string>('all')

  const departments = useMemo(() => {
    const set = new Set<string>()
    for (const j of jobs ?? []) if (j.department) set.add(j.department)
    return [...set].sort()
  }, [jobs])

  const shown = useMemo(
    () => (jobs ?? []).filter((j) => dept === 'all' || j.department === dept),
    [jobs, dept],
  )

  // A fetch failure and a genuinely empty board are different states and must read differently.
  if (jobs === null) {
    return (
      <p className="cs-body border-t border-[rgba(242,240,234,0.14)] pt-8">
        We could not load open roles just now. Please try again shortly, or write to us and we will
        point you to the current list.
      </p>
    )
  }

  if (!jobs.length) {
    return (
      <p className="cs-body border-t border-[rgba(242,240,234,0.14)] pt-8">
        No roles are open at the moment. We still read every introduction — get in touch and we
        will keep you in mind.
      </p>
    )
  }

  return (
    <>
      {departments.length > 1 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDept('all')}
            aria-pressed={dept === 'all'}
            className={`cs-chip cs-meta ${dept === 'all' ? 'is-on' : ''}`}
          >
            All teams
          </button>
          {departments.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDept(d)}
              aria-pressed={dept === d}
              className={`cs-chip cs-meta ${dept === d ? 'is-on' : ''}`}
            >
              {d}
            </button>
          ))}
          <span className="cs-meta ml-1.5" aria-live="polite">
            {shown.length} {shown.length === 1 ? 'role' : 'roles'}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col">
        {shown.map((job) => (
          <Link key={job.slug} href={`/job/${job.slug}`} className="cs-role py-9 lg:py-10">
            <div className="flex flex-wrap items-baseline justify-between gap-6">
              <h3 className="m-0 font-display text-[clamp(23px,2.6vw,40px)] font-medium tracking-[-0.026em]">
                {job.title}
              </h3>
              <span aria-hidden className="cs-go cs-meta">
                Learn more →
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2">
              {job.location ? <span className="cs-meta">{job.location}</span> : null}
              {job.seniority_level ? <span className="cs-meta">{job.seniority_level}</span> : null}
              {job.employment_type ? <span className="cs-meta">{job.employment_type}</span> : null}
              {job.department ? <span className="cs-meta">{job.department}</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
