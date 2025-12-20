import { Navigation } from "./components/Navigation";
import { FuturisticHero } from "./components/FuturisticHero";
import { LogoCloud } from "./components/LogoCloud";
import { BentoFeatures } from "./components/BentoFeatures";
import { Floating3DEmailCards } from "./components/Floating3DEmailCards";
import { HowItWorksSection } from "./components/HowItWorksSection";
import { AIBrainVisualization } from "./components/AIBrainVisualization";
import { BeforeAfterSlider } from "./components/BeforeAfterSlider";
import { EmailPreviewCarousel } from "./components/EmailPreviewCarousel";
import { ROICalculator } from "./components/ROICalculator";
import { SocialProofSection } from "./components/SocialProofSection";
import { ComparisonTable } from "./components/ComparisonTable";
import { PricingSection } from "./components/PricingSection";
import { SecurityBadges } from "./components/SecurityBadges";
import { FAQSection } from "./components/FAQSection";
import { CTASection } from "./components/CTASection";
import { Footer } from "./components/Footer";
import { StickyCtaBar } from "./components/StickyCtaBar";
import { LiveActivityFeed } from "./components/LiveActivityFeed";
import { ExitIntentPopup } from "./components/ExitIntentPopup";
import { Toaster } from "./components/ui/sonner";

export default function App() {
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
      <ExitIntentPopup />
      <Toaster />
    </div>
  );
}