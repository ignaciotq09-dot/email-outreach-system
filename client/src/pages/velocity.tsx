import { Navigation } from "../components/velocity/Navigation";
import { FuturisticHero } from "../components/velocity/FuturisticHero";
import { LogoCloud } from "../components/velocity/LogoCloud";
import { BentoFeatures } from "../components/velocity/BentoFeatures";
import { Floating3DEmailCards } from "../components/velocity/Floating3DEmailCards";
import { HowItWorksSection } from "../components/velocity/HowItWorksSection";
import { AIBrainVisualization } from "../components/velocity/AIBrainVisualization";
import { BeforeAfterSlider } from "../components/velocity/BeforeAfterSlider";
import { EmailPreviewCarousel } from "../components/velocity/EmailPreviewCarousel";
import { ROICalculator } from "../components/velocity/ROICalculator";
import { SocialProofSection } from "../components/velocity/SocialProofSection";
import { ComparisonTable } from "../components/velocity/ComparisonTable";
import { PricingSection } from "../components/velocity/PricingSection";
import { SecurityBadges } from "../components/velocity/SecurityBadges";
import { FAQSection } from "../components/velocity/FAQSection";
import { CTASection } from "../components/velocity/CTASection";
import { Footer } from "../components/velocity/Footer";
import { StickyCtaBar } from "../components/velocity/StickyCtaBar";
import { LiveActivityFeed } from "../components/velocity/LiveActivityFeed";
import { Toaster } from "@/components/ui/toaster";

export default function VelocityLanding() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navigation />
      <FuturisticHero />
      <LogoCloud />
      <BentoFeatures />
      <AIBrainVisualization />
      <Floating3DEmailCards />
      <HowItWorksSection />
      <BeforeAfterSlider />
      <EmailPreviewCarousel />
      <ROICalculator />
      <SocialProofSection />
      <ComparisonTable />
      <PricingSection />
      <SecurityBadges />
      <FAQSection />
      <CTASection />
      <Footer />
      <StickyCtaBar />
      <LiveActivityFeed />
      <Toaster />
    </div>
  );
}