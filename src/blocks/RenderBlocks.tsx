import type { Page } from '@/payload-types'
import type { TypedLocale } from 'payload'

import type { JSX } from 'react'
import { Fragment } from 'react'

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
  'capabilityLedger',
])

/**
 * Renders a single block by switching on `blockType`. The switch narrows the discriminated
 * union, so each component gets fully-typed props (no casts). New blocks: register the config
 * on the Pages collection and add a case here.
 */
function renderBlock(block: BlockType, locale?: TypedLocale): JSX.Element | null {
  switch (block.blockType) {
    case 'hero':
      return <HeroComponent {...block} />
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
      return <CtaBlockComponent {...block} />
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
      return <CareersHeroComponent {...block} />
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
}: {
  blocks?: Page['layout']
  locale?: TypedLocale
}): JSX.Element | null {
  if (!blocks?.length) return null

  return (
    <div className="flex flex-col gap-16 lg:gap-[72px] text-cream max-w-7xl mx-auto w-full px-5 md:px-8 lg:px-12 pt-20 lg:pt-40 lg:pb-24 pb-10">
      {blocks.map((block, i) => {
        const el = renderBlock(block, locale)
        if (!el) return null
        // Self-wrapping granular blocks already render their own Motion section — render directly.
        if (SELF_WRAPPED_BLOCKS.has(block.blockType)) {
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
}
