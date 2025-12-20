import {
  Navigation,
  FuturisticHero,
  LogoCloud,
  BentoFeatures,
  AIBrainVisualization,
  Floating3DEmailCards,
  HowItWorksSection,
  BeforeAfterSlider,
  EmailPreviewCarousel,
  ROICalculator,
  SocialProofSection,
  ComparisonTable,
  PricingSection,
  SecurityBadges,
  FAQSection,
  CTASection,
  Footer,
  StickyCtaBar,
  LiveActivityFeed,
} from '@/components/velocity';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <FuturisticHero />
      <LogoCloud />
      <BentoFeatures />
      <AIBrainVisualization />
      <Floating3DEmailCards />
      <EmailPreviewCarousel />
      <BeforeAfterSlider />
      <HowItWorksSection />
      <LiveActivityFeed />
      <SocialProofSection />
      <ComparisonTable />
      <ROICalculator />
      <SecurityBadges />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <StickyCtaBar />
    </div>
  );
}
