import Motion from '@/components/animation/motion'
import { revealItem } from '@/components/animation/reveal'
import { toneFor, type Tone } from '@/components/layout/GradientPanel'
import { cn } from '@/lib/utils'
import type { JSX } from 'react'

/**
 * Numbered step sequence — ghost numeral, title, body, threaded by a hairline rule with a node
 * dot per column.
 *
 * Extracted verbatim from the capability detail page's "How we do it" band
 * (`capabilities/[slug]/page.tsx`, Section 02) so that surface and the case-study detail page
 * render one implementation instead of two drifting copies. Every colour, type size, spacing step
 * and numeral opacity below is the value that band already shipped — nothing here is new design.
 *
 * ── Alignment ───────────────────────────────────────────────────────────────────────────────
 * The columns are locked to a shared baseline grid with CSS subgrid, not fixed heights. The list
 * is the grid and owns the row tracks (node · numeral · title · body); each step is a grid item
 * spanning those rows with `grid-template-rows: subgrid`, so every numeral shares one track, every
 * title shares the next, and every body shares the last. A title that wraps to three lines grows
 * the shared title track and pushes *all* the bodies down together — the tops stay level for any
 * copy, which is exactly what a per-column stack (or a `min-h` patch) cannot promise.
 *
 * Row spacing is carried by margins on the row elements rather than the grid's `row-gap`, because
 * a subgrid inherits one row-gap for every track: a gap large enough to separate two wrapped rows
 * of steps would also blow the numeral/title/body rhythm apart. With `row-gap: 0` the intra-step
 * rhythm is set by `mb-6`/`mt-3` (the band's original `gap-6`/`gap-3`), and the space between
 * wrapped rows of steps is re-added per item by `BAND_BREAK` below.
 */

/**
 * Key colours of the brand TONE gradients (GradientPanel) as raw RGB triplets, so decorative
 * washes can borrow the palette at very low alpha without minting any new colours. Cycle order
 * mirrors `toneFor`'s positional fallback, keeping accents consistent across sections.
 *
 * NOTE (inherited hardcode, flagged rather than re-derived): these are hand-copied first stops of
 * the `TONE` gradient strings in `components/layout/GradientPanel.tsx` — e.g. crimson `#c1285f`
 * → `193, 40, 95` — and there is no token for them. They live here only because this component
 * and the capability page both need them and GradientPanel was out of scope to edit; the right
 * long-term home is beside `TONE` itself.
 */
export const TONE_RGB: Record<Tone, string> = {
  crimson: '193, 40, 95',
  violet: '124, 58, 237',
  emerald: '31, 157, 107',
  azure: '47, 147, 218',
  magenta: '182, 36, 154',
  indigo: '79, 107, 237',
}

export type Step = {
  title: string
  body: string
}

export type NumberedStepsProps = {
  /** 2–4 steps; three is the typical shape. */
  steps: Step[]
  /** Numerals render zero-padded from here. */
  startIndex?: number
  /** Hairline rule + node dots above the sequence. */
  showRule?: boolean
}

/**
 * The grid wraps at two columns from `md` and three from `lg`, so with 2–4 steps only indices 2
 * and 3 can ever begin a second row of steps — and each only at the breakpoint whose column count
 * actually wraps it. Both maps below are keyed on that fact.
 *
 * BAND_BREAK — extra space above a step that opens a new row. Every step in a given row carries
 * the same value, so the shared tracks stay aligned. `mt-12` is the band's original `gap-12`.
 */
const BAND_BREAK: Record<number, string> = {
  2: 'md:mt-12 lg:mt-0',
  3: 'md:mt-12 lg:mt-12',
}

/**
 * BAND_START — visibility for the hairline rule, which is drawn by the step that opens each row
 * (see the rule's own comment for why it hangs off the step rather than the container). Index 0
 * opens a row at every breakpoint; index 2 opens one only at `md`, where two columns wrap it;
 * index 3 only at `lg`.
 */
const BAND_START: Record<number, string> = {
  0: 'hidden md:flex',
  2: 'hidden md:flex lg:hidden',
  3: 'hidden lg:flex',
}

export default function NumberedSteps({ steps, startIndex = 1, showRule = true }: NumberedStepsProps): JSX.Element {
  // Row tracks the steps subgrid onto: node · numeral · title · body, or the last three when the
  // rule (and so the node dots) is suppressed.
  const rowTracks = showRule ? 'md:grid-rows-[auto_auto_auto_auto]' : 'md:grid-rows-[auto_auto_auto]'
  const rowSpan = showRule ? 'md:row-span-4' : 'md:row-span-3'

  return (
    /* Below md the subgrid collapses: each step is an ordinary stack with a generous gap. From md
       the list owns the row tracks and every step subgrids onto them. Row spacing is margin driven
       (see the file header), hence `gap-y-0`. `--steps-cols` / `--steps-gap` are the column count
       and column gap in one place, because the rule below has to compute the grid's full width
       from them. */
    <ol
      start={startIndex}
      className={cn(
        'flex flex-col gap-12 [--steps-gap:2.5rem] md:grid md:grid-cols-2 md:[--steps-cols:2]',
        'md:gap-x-[var(--steps-gap)] md:gap-y-0 lg:grid-cols-3 lg:[--steps-cols:3]',
        rowTracks,
      )}
    >
      {steps.map((step, i) => {
        const tone = toneFor(null, i)
        return (
          <Motion
            tag="li"
            key={`${step.title}-${i}`}
            className={cn('group relative flex flex-col', rowSpan, 'md:grid md:grid-rows-subgrid', BAND_BREAK[i])}
            {...revealItem(i)}
          >
            {/* hover tint — a faint tonal field that surfaces the active step */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-x-4 -inset-y-5 rounded-md opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                backgroundImage: `radial-gradient(85% 75% at 22% 8%, rgba(${TONE_RGB[tone]}, 0.09) 0%, transparent 62%)`,
              }}
            />

            {/* connector line — drawn by the step that opens each row of steps rather than once by
                the container, so a wrapped row gets its own rule instead of an orphaned dot. Such a
                step always sits in column 1, so `left-0` is the grid's left edge and the width is
                the whole grid: N columns plus the N-1 gaps between them. The element is exactly the
                node's own height (`h-3.5`, the token the dot itself uses) and centres the hairline
                in it, so the line meets the dots' midpoint without a magic offset. */}
            {showRule && BAND_START[i] && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-0 top-0 h-3.5 w-[calc(100%*var(--steps-cols)+var(--steps-gap)*(var(--steps-cols)-1))] items-center',
                  BAND_START[i],
                )}
              >
                <span className="h-px w-full bg-gradient-to-r from-line via-line-strong to-line" />
              </span>
            )}

            {/* node on the sequence line */}
            {showRule && (
              <span
                aria-hidden
                className="relative z-10 mb-6 block size-3.5 rounded-full border border-line-strong bg-page ring-4 ring-page"
              >
                <span className="absolute inset-[3px] rounded-full bg-cream/70 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
              </span>
            )}

            {/* oversized ghost numeral — decorative; the <ol> carries the real order, and a
                screen reader announcing "zero one" would add nothing. */}
            <span
              aria-hidden
              className="relative font-display text-[clamp(3.25rem,5.5vw,4.5rem)] font-medium leading-none tabular-nums tracking-[-0.04em] text-cream/[0.14] transition-colors duration-500 group-hover:text-cream/25"
            >
              {String(startIndex + i).padStart(2, '0')}
            </span>

            <h3 className="relative mt-3 text-[18px] font-medium tracking-[-0.02em] text-cream">{step.title}</h3>

            <p className="relative mt-3 max-w-xs text-[15px] leading-relaxed text-body">{step.body}</p>
          </Motion>
        )
      })}
    </ol>
  )
}
