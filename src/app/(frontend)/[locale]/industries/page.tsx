import Heading from '@/components/a11y/Heading'
import Reveal from '@/components/hub/Reveal'
import Link from '@/components/LocalizedLink'
import { asTypedLocale } from '@/lib/i18n/locales'
import { ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import '@/components/hub/hub.css'
import './industriesHub.css'
import SectorIndex from './SectorIndex'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!asTypedLocale(locale)) return {}
  return {
    title: 'Industries',
    description:
      'We build where the stakes are specific — sectors where the rules, the risk, and the vocabulary are specific, with named work behind them.',
  }
}

// The "before we write a line of code" ladder and the regulatory posture — hardcoded; voice
// preserved verbatim from the approved preview.
const APPROACH = [
  {
    k: '1',
    title: 'Learn the rules',
    body: 'Regulation, workflows, vocabulary. We study how your world actually runs before proposing how software should.',
  },
  {
    k: '2',
    title: 'Sit with the operators',
    body: 'The people doing the work every day know exactly where it breaks. We build from beside them, not from a spec.',
  },
  {
    k: '3',
    title: 'Build to the constraints',
    body: 'Compliance, uptime windows, audit trails — treated as first-class requirements from day one, not patched in later.',
  },
]

const POSTURE = [
  {
    k: 'a',
    title: 'Traceable by default',
    body: 'Every consequential action is attributable and replayable, months after the fact.',
  },
  {
    k: 'b',
    title: 'Deployed inside the boundary',
    body: 'On-premises and air-gapped patterns, for data that legally cannot leave the building.',
  },
  {
    k: 'c',
    title: 'Documented for procurement',
    body: 'Architecture, controls, and evidence packaged the way review boards actually ask for them.',
  },
]

export default async function IndustriesHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!asTypedLocale(locale)) notFound()

  return (
    <div className="hub">
      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <Reveal className="eyebrow">Industries</Reveal>
          <Reveal i={1}>
            <Heading level={1}>We build where the stakes are specific.</Heading>
          </Reveal>
          <Reveal as="p" className="hero-sub" i={2}>
            Every sector has its own rules, risks, and vocabulary. We learn yours before we build — because generic
            software doesn&rsquo;t survive contact.
          </Reveal>
        </div>
      </section>

      {/* THE SECTORS */}
      <section className="sec-b">
        <div className="wrap">
          <Reveal className="sec-head">
            <div>
              <span className="eyebrow">The sectors</span>
              <Heading level={2}>Where we build</Heading>
            </div>
            <p className="sec-sub">
              Each entry opens into the work behind it. Where a client can be named, they are — proof, not a blurb.
            </p>
          </Reveal>
          <Reveal i={1}>
            <SectorIndex />
          </Reveal>
        </div>
      </section>

      {/* HOW WE ENTER */}
      <section className="sec-b">
        <div className="wrap split">
          <Reveal x>
            <span className="eyebrow">Our approach</span>
            <Heading level={2} className="split-lead">
              Before we write a line of code.
            </Heading>
          </Reveal>
          {/* a sequence — the tiles carry a directional wash so the order reads without numbering */}
          <div className="ladder ladder-flow">
            {APPROACH.map((step, i) => (
              <Reveal className="step" i={i} key={step.k}>
                <div>
                  <Heading level={3}>{step.title}</Heading>
                  <p>{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* REGULATORY POSTURE */}
      <section className="sec-b">
        <div className="wrap split">
          <Reveal x>
            <span className="eyebrow">Regulatory posture</span>
            <Heading level={2} className="split-lead">
              Built to be audited.
            </Heading>
          </Reveal>
          {/* not a sequence — three standing guarantees, so every tile is lit evenly */}
          <div className="ladder ladder-stack">
            {POSTURE.map((point, i) => (
              <Reveal className="step" i={i} key={point.k}>
                <div>
                  <Heading level={3}>{point.title}</Heading>
                  <p>{point.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="wrap">
          <Reveal className="eyebrow">Start here</Reveal>
          <Reveal i={1}>
            <Heading level={2}>Don&rsquo;t see your industry?</Heading>
          </Reveal>
          <Reveal as="p" i={2}>
            The list above grows with the work. If your world has its own rules and real stakes, we&rsquo;re interested
            — and your first conversation is with someone who&rsquo;s built in a sector like yours, not a generalist.
          </Reveal>
          <Reveal className="btns" i={3}>
            <Link className="btn btn-primary" href="/contact">
              Start a conversation
              <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </Link>
            <Link className="btn btn-ghost" href="/stories">
              See our work
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
