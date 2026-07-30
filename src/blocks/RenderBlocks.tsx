import type { RichText } from '@/components/richtext'
import type { Page } from '@/payload-types'
import type { TypedLocale } from 'payload'

import type { JSX } from 'react'
import { Fragment } from 'react'

import AboutEditorialCta from '@/components/about/AboutEditorialCta'
import ShaderHero from '@/components/ShaderHero'
import AboutExperience from '@/components/about/AboutExperience'
import CareersScene from '@/components/careers/CareersScene'
import Motion from '@/components/animation/motion'
import { AboutApproachComponent } from './AboutApproach/Component'
import { AboutBeliefsComponent } from './AboutBeliefs/Component'
import { AboutFundingStoryComponent } from './AboutFundingStory/Component'
import { AboutIntroComponent } from './AboutIntro/Component'
import { AboutLeadershipComponent } from './AboutLeadership/Component'
import { AboutProofOfScaleComponent } from './AboutProofOfScale/Component'
import { AboutThesisComponent } from './AboutThesis/Component'
import { CapabilityLedgerComponent } from './CapabilityLedger/Component'
import { CareersGridOneComponent } from './CareersGridOne/Component'
import { CareersGridTwoComponent } from './CareersGridTwo/Component'
import { CareersGrowthComponent } from './CareersGrowth/Component'
import { CareersHeroComponent } from './CareersHero/Component'
import { CareersTeamComponent } from './CareersTeam/Component'
import { CategoryLandingComponent } from './CategoryLanding/Component'
import { ContactFormComponent } from './ContactForm/Component'
import { ContactHeroComponent } from './ContactHero/Component'
import { ContactOfficesComponent } from './ContactOffices/Component'
import { ContactRoutesComponent } from './ContactRoutes/Component'
import { ContactStatsComponent } from './ContactStats/Component'
import { CrossIndustryPatternsComponent } from './CrossIndustryPatterns/Component'
import { CtaBlockComponent } from './Cta/Component'
import { FeatureCaseStudyComponent } from './FeatureCaseStudy/Component'
import { HeroComponent } from './Hero/Component'
import { HeroFeaturedComponent } from './HeroFeatured/Component'
import {
  AboutSectionComponent,
  CapabilitiesSectionComponent,
  EngagementSectionComponent,
  GlobalDeliverySectionComponent,
  OpportunitiesSectionComponent,
  ProcessSectionComponent,
  ScalesSectionComponent,
  SolutionsSectionComponent,
  TeamSectionComponent,
} from './homeSections/Component'
import { IndustriesDetailsComponent } from './IndustriesDetails/Component'
import { IndustriesSectionComponent } from './IndustriesSection/Component'
import { IndustryListComponent } from './IndustryList/Component'
import { IndustryPanelsComponent } from './IndustryPanels/Component'
import { InsightsListComponent } from './InsightsList/Component'
import { JobsBlockComponent } from './Jobs/Component'
import { QualityBarComponent } from './QualityBar/Component'
import { RegulatoryPostureComponent } from './RegulatoryPosture/Component'
import { ScalesHeroComponent } from './ScalesHero/Component'
import { ScaleShowcaseComponent } from './ScaleShowcase/Component'
import { SolutionFeatureComponent } from './SolutionFeature/Component'
import { SolutionsEngageComponent } from './SolutionsEngage/Component'
import { SolutionsHeroComponent } from './SolutionsHero/Component'
import { StoriesArchiveComponent } from './StoriesArchive/Component'
import { SubscribeComponent } from './Subscribe/Component'

type BlockType = NonNullable<Page['layout']>[number]

// Mirror the bespoke page's per-section fade-up so blocks-driven pages animate identically.
const motionSectionProps = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.2 as const },
  transition: { duration: 0.4, ease: 'easeOut' as const },
}

// Granular redesign blocks (Phase 2) self-wrap in their own `<Motion tag="section">` (extracted
// verbatim from the monolith Components). Render them directly so RenderBlocks does not add a
// second section/fade wrapper around them — keeping the rendered structure identical.
const SELF_WRAPPED_BLOCKS = new Set<string>([
  'hero',
  'heroFeatured',
  'industriesSection',
  'scalesHero',
  'qualityBar',
  'scaleShowcase',
  'ctaBlock',
  // Granular redesign blocks (Phase 2) — each self-wraps in its own Motion section.
  'contactHero',
  'contactStats',
  'contactRoutes',
  'contactOffices',
  'contactForm',
  'featureCaseStudy',
  'storiesArchive',
  'insightsList',
  'categoryLanding',
  'subscribe',
  'industryList',
  'industriesDetails',
  'industryPanels',
  'crossIndustryPatterns',
  'regulatoryPosture',
  'solutionsHero',
  'solutionFeature',
  'solutionsEngage',
  'aboutFundingStory',
  'aboutIntro',
  'aboutThesis',
  'aboutBeliefs',
  'aboutApproach',
  'aboutProofOfScale',
  'aboutLeadership',
  'careersHero',
  'careersGridOne',
  'careersGridTwo',
  'careersGrowth',
  'careersTeam',
  // processSection renders its own <section>: the shared wrapper below is a Motion with
  // initial opacity 0, and Motion strands that value when useReducedMotion() resolves
  // true or when JS never runs — measured, the whole section computed opacity 0 under
  // both. Its pinned stage also needs to not be nested in an extra layout box.
  'processSection',
  'capabilityLedger',
])

/**
 * Renders a single block by switching on `blockType`. The switch narrows the discriminated
 * union, so each component gets fully-typed props (no casts). New blocks: register the config
 * on the Pages collection and add a case here.
 */
function renderBlock(block: BlockType, locale?: TypedLocale, slug?: string): JSX.Element | null {
  // About-scoped variants. `hero` is shared by six pages and `ctaBlock` by five, so the About
  // redesign cannot edit either in place without changing Insights, Industries, Solutions,
  // Stories, Capabilities and Scales as a side effect. Branching on the page slug keeps the
  // editorial treatment on About and leaves every other page rendering the shared component
  // unchanged. Both variants self-wrap, and both block types are already in SELF_WRAPPED_BLOCKS.
  const isAbout = slug === 'about'

  switch (block.blockType) {
    case 'hero':
      // About's hero is the WebGL shader field. AboutEditorialHero is no longer mounted, but the
      // file remains in the repo if the shader is ever reverted. Every other page using `hero`
      // renders the shared component unchanged.
      return isAbout ? (
        <ShaderHero heading={block.heading} description={block.description as RichText | null} locale={locale} />
      ) : (
        <HeroComponent {...block} />
      )
    case 'heroFeatured':
      return <HeroFeaturedComponent {...block} />
    case 'industriesSection':
      return <IndustriesSectionComponent {...block} />
    case 'aboutSection':
      return <AboutSectionComponent {...block} />
    case 'solutionsSection':
      return <SolutionsSectionComponent {...block} />
    case 'capabilitiesSection':
      return <CapabilitiesSectionComponent {...block} />
    case 'capabilityLedger':
      return <CapabilityLedgerComponent {...block} />
    case 'scalesSection':
      return <ScalesSectionComponent {...block} />
    case 'engagementSection':
      return <EngagementSectionComponent {...block} />
    case 'globalDeliverySection':
      return <GlobalDeliverySectionComponent {...block} />
    case 'processSection':
      return <ProcessSectionComponent {...block} />
    case 'teamSection':
      return <TeamSectionComponent {...block} />
    case 'opportunitiesSection':
      return <OpportunitiesSectionComponent {...block} />
    case 'scalesHero':
      return <ScalesHeroComponent {...block} />
    case 'qualityBar':
      return <QualityBarComponent {...block} />
    case 'scaleShowcase':
      return <ScaleShowcaseComponent {...block} />
    case 'jobsBlock':
      return <JobsBlockComponent {...block} />
    case 'ctaBlock':
      return isAbout ? <AboutEditorialCta {...block} /> : <CtaBlockComponent {...block} />
    // Granular redesign blocks (Phase 2).
    case 'contactHero':
      return <ContactHeroComponent {...block} />
    case 'contactStats':
      return <ContactStatsComponent {...block} />
    case 'contactRoutes':
      return <ContactRoutesComponent {...block} />
    case 'contactOffices':
      return <ContactOfficesComponent {...block} />
    case 'contactForm':
      return <ContactFormComponent {...block} />
    case 'featureCaseStudy':
      return <FeatureCaseStudyComponent {...block} />
    case 'storiesArchive':
      return <StoriesArchiveComponent {...block} locale={locale} />
    case 'insightsList':
      return <InsightsListComponent {...block} />
    case 'categoryLanding':
      return <CategoryLandingComponent {...block} />
    case 'subscribe':
      return <SubscribeComponent {...block} />
    case 'industryList':
      return <IndustryListComponent {...block} />
    case 'industriesDetails':
      return <IndustriesDetailsComponent {...block} />
    case 'industryPanels':
      return <IndustryPanelsComponent {...block} />
    case 'crossIndustryPatterns':
      return <CrossIndustryPatternsComponent {...block} />
    case 'regulatoryPosture':
      return <RegulatoryPostureComponent {...block} />
    case 'solutionsHero':
      return <SolutionsHeroComponent {...block} />
    case 'solutionFeature':
      return <SolutionFeatureComponent {...block} />
    case 'solutionsEngage':
      return <SolutionsEngageComponent {...block} />
    case 'aboutFundingStory':
      return <AboutFundingStoryComponent {...block} />
    case 'aboutIntro':
      return <AboutIntroComponent {...block} />
    case 'aboutThesis':
      return <AboutThesisComponent {...block} />
    case 'aboutBeliefs':
      return <AboutBeliefsComponent {...block} />
    case 'aboutApproach':
      return <AboutApproachComponent {...block} />
    case 'aboutProofOfScale':
      return <AboutProofOfScaleComponent {...block} />
    case 'aboutLeadership':
      return <AboutLeadershipComponent {...block} locale={locale} />
    case 'careersHero':
      return <CareersHeroComponent {...block} locale={locale} />
    case 'careersGridOne':
      return <CareersGridOneComponent {...block} />
    case 'careersGridTwo':
      return <CareersGridTwoComponent {...block} />
    case 'careersGrowth':
      return <CareersGrowthComponent {...block} />
    case 'careersTeam':
      return <CareersTeamComponent {...block} />
    default:
      return null
  }
}

/**
 * Renders a Page's `layout` blocks inside the shared page container — the section components
 * are full-bleed by design and rely on this wrapper for max-width, centering, the 20px gutter
 * and the vertical rhythm between sections (matching the bespoke homepage layout).
 */
export function RenderBlocks({
  blocks,
  locale,
  slug,
}: {
  blocks?: Page['layout']
  locale?: TypedLocale
  /** Page slug, used to select page-scoped variants of otherwise shared blocks. */
  slug?: string
}): JSX.Element | null {
  if (!blocks?.length) return null

  const isAbout = slug === 'about'

  // About runs as one continuous scene experience: the scenes are full-bleed and own their own
  // vertical rhythm, so the shared container's gap and top padding would only insert dead space
  // between them. Every other page keeps the standard container exactly as before.
  // BLOCK, NOT FLEX, and that is load-bearing. GSAP pins by wrapping the section in a
  // pin-spacer that reserves the scroll distance; as a flex item that spacer stops sizing
  // correctly, so the following scene slid up underneath the still-pinned one and two or three
  // scenes rendered on top of each other between roughly 16% and 50% of the page. Measured, not
  // theorised. The scenes are full-width blocks and never needed flex.
  const isCareers = slug === 'careers'

  const containerClass = isAbout || isCareers
    ? 'block w-full text-cream pb-10 lg:pb-24'
    : 'flex flex-col gap-16 lg:gap-[72px] text-cream max-w-7xl mx-auto w-full px-5 md:px-8 lg:px-12 pt-20 lg:pt-40 lg:pb-24 pb-10'

  // On About the container itself goes full-width so the scenes can hold the viewport edge to
  // edge without a 100vw trick (which overhangs by the scrollbar and scrolls the page
  // sideways). Blocks that are NOT scenes — the Leadership block — get the shared container
  // restored around them, so that section keeps exactly the max-width, gutters and rhythm it
  // has on the live site. Its own markup is untouched; only its wrapper is involved, which is
  // the one change the preservation rule permits.
  // `bg-page`, NOT `ax-black`. The ax-black class carries the strict-contrast text rules, and
  // those were measured reaching into the Leadership block and repainting its heading and
  // paragraph (#f4f3ec/#aaaaaa -> #f2f0ea) — a styling change to a component that must stay
  // byte-identical. This gives the same black ground and touches nothing inside.
  const aboutFrame = 'bg-page w-full'
  const aboutFrameInner = 'mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-12 py-24 lg:py-32'

  const content = (
    <div className={containerClass}>
      {blocks.map((block, i) => {
        const el = renderBlock(block, locale, slug)
        if (!el) return null
        // Self-wrapping granular blocks already render their own Motion section — render directly.
        if (SELF_WRAPPED_BLOCKS.has(block.blockType)) {
          if (isAbout && block.blockType === 'aboutLeadership') {
            return (
              <div className={aboutFrame} key={block.id || i}>
                <div className={aboutFrameInner}>{el}</div>
              </div>
            )
          }
          return <Fragment key={block.id || i}>{el}</Fragment>
        }
        return (
          <Motion tag="section" className="w-full" key={block.id || i} {...motionSectionProps}>
            {el}
          </Motion>
        )
      })}
    </div>
  )

  // One engine for the whole About page, not a wrapper per block — that is what lets the scenes
  // hand over to each other rather than behave as independent widgets. The Leadership block sits
  // inside it but carries no scene marker, so nothing in the engine reaches it.
  if (isAbout) return <AboutExperience>{content}</AboutExperience>
  // Careers runs its own scene layer: the sections are full-width and own their vertical rhythm,
  // and the engine replaces the shared <Motion> reveals that were shipping 39 elements at inline
  // opacity:0 into the SSR HTML.
  if (isCareers) return <CareersScene>{content}</CareersScene>
  return content
}
