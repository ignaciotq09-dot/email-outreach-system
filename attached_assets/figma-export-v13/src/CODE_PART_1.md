# VELOCITY Landing Page - Complete Code Part 1 of 5

## ✅ This file contains EVERY SINGLE LINE for:
- `/App.tsx` - Main application entry point
- `/styles/globals.css` - Complete global styles
- Component 1: Navigation.tsx
- Component 2: FuturisticHero.tsx
- Component 3: LogoCloud.tsx
- Component 4: BentoFeatures.tsx

---

## `/App.tsx`

```tsx
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
```

---

## `/styles/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');

@custom-variant dark (&:is(.dark *));

:root {
  /* Brand Colors - Primary */
  --deep-navy: #0F172A;
  --electric-teal: #0EA5E9; /* Changed to a more professional blue */
  --pure-white: #FFFFFF;
  
  /* Brand Colors - Secondary */
  --slate-600: #475569;
  --slate-400: #94A3B8;
  --slate-200: #E2E8F0;
  --slate-50: #F8FAFC;
  --slate-100: #F1F5F9;
  
  /* Brand Colors - Semantic */
  --success-green: #10B981;
  --warning-amber: #F59E0B;
  --error-red: #EF4444;
  --info-blue: #3B82F6;
  
  /* Typography Sizes */
  --text-hero: 56px;
  --text-h1: 36px;
  --text-h2: 24px;
  --text-h3: 20px;
  --text-body: 16px;
  --text-small: 14px;
  --text-tiny: 12px;
  
  /* Font Weights */
  --font-weight-black: 900;
  --font-weight-bold: 700;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  
  /* Border Radius */
  --radius-small: 4px;
  --radius-medium: 8px;
  --radius-large: 12px;
  
  /* Shadows */
  --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.15);
  --shadow-strong: 0 10px 15px rgba(0, 0, 0, 0.20);
  
  /* Spacing Scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 48px;
  --space-4xl: 64px;
  
  /* System Colors (mapped to brand) */
  --font-size: 16px;
  --background: var(--pure-white);
  --foreground: var(--deep-navy);
  --card: var(--pure-white);
  --card-foreground: var(--deep-navy);
  --popover: var(--pure-white);
  --popover-foreground: var(--deep-navy);
  --primary: var(--deep-navy);
  --primary-foreground: var(--pure-white);
  --secondary: var(--slate-50);
  --secondary-foreground: var(--deep-navy);
  --muted: var(--slate-50);
  --muted-foreground: var(--slate-600);
  --accent: var(--electric-teal);
  --accent-foreground: var(--pure-white);
  --destructive: var(--error-red);
  --destructive-foreground: var(--pure-white);
  --border: var(--slate-200);
  --input: transparent;
  --input-background: var(--slate-50);
  --switch-background: var(--slate-400);
  --ring: var(--electric-teal);
  --chart-1: var(--electric-teal);
  --chart-2: var(--info-blue);
  --chart-3: var(--success-green);
  --chart-4: var(--warning-amber);
  --chart-5: var(--deep-navy);
  --radius: var(--radius-medium);
  --sidebar: var(--slate-50);
  --sidebar-foreground: var(--deep-navy);
  --sidebar-primary: var(--deep-navy);
  --sidebar-primary-foreground: var(--pure-white);
  --sidebar-accent: var(--slate-200);
  --sidebar-accent-foreground: var(--slate-600);
  --sidebar-border: var(--slate-200);
  --sidebar-ring: var(--electric-teal);
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes pulse-glow {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
  }
  50% { 
    box-shadow: 0 0 40px rgba(6, 182, 212, 0.8);
  }
}

@keyframes rotate-gradient {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom scrollbar with brand colors */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: var(--slate-50);
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, var(--electric-teal), var(--deep-navy));
  border-radius: var(--radius-small);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--electric-teal);
}

.dark {
  --background: var(--deep-navy);
  --foreground: var(--pure-white);
  --card: #1E293B;
  --card-foreground: var(--pure-white);
  --popover: #1E293B;
  --popover-foreground: var(--pure-white);
  --primary: var(--pure-white);
  --primary-foreground: var(--deep-navy);
  --secondary: #1E293B;
  --secondary-foreground: var(--pure-white);
  --muted: #334155;
  --muted-foreground: var(--slate-400);
  --accent: var(--electric-teal);
  --accent-foreground: var(--pure-white);
  --destructive: var(--error-red);
  --destructive-foreground: var(--pure-white);
  --border: #334155;
  --input: #334155;
  --ring: var(--electric-teal);
  --sidebar: #1E293B;
  --sidebar-foreground: var(--pure-white);
  --sidebar-primary: var(--electric-teal);
  --sidebar-primary-foreground: var(--pure-white);
  --sidebar-accent: #334155;
  --sidebar-accent-foreground: var(--pure-white);
  --sidebar-border: #334155;
  --sidebar-ring: var(--electric-teal);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: var(--radius-small);
  --radius-md: var(--radius-medium);
  --radius-lg: var(--radius-large);
  --radius-xl: calc(var(--radius-large) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
}

/**
 * Base typography with brand-specific sizes and weights
 */
@layer base {
  :where(:not(:has([class*=' text-']), :not(:has([class^='text-'])))) {
    h1 {
      font-size: var(--text-h1);
      font-weight: var(--font-weight-bold);
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    h2 {
      font-size: var(--text-h2);
      font-weight: var(--font-weight-bold);
      line-height: 1.3;
      letter-spacing: -0.01em;
    }

    h3 {
      font-size: var(--text-h3);
      font-weight: var(--font-weight-bold);
      line-height: 1.4;
    }

    h4 {
      font-size: var(--text-body);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    p {
      font-size: var(--text-body);
      font-weight: var(--font-weight-normal);
      line-height: 1.6;
    }

    label {
      font-size: var(--text-body);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    button {
      font-size: var(--text-body);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    input {
      font-size: var(--text-body);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }
  }
}

html {
  font-size: var(--font-size);
}

/* Brand-specific utility classes */
.text-hero {
  font-size: var(--text-hero);
  font-weight: var(--font-weight-bold);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.velocity-logo {
  font-family: 'Inter', sans-serif;
  font-weight: var(--font-weight-black);
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

.shadow-brand-subtle {
  box-shadow: var(--shadow-subtle);
}

.shadow-brand-medium {
  box-shadow: var(--shadow-medium);
}

.shadow-brand-strong {
  box-shadow: var(--shadow-strong);
}
```

---

## Component 1: `/components/Navigation.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronDown, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm'
          : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex-shrink-0"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="font-bold text-lg text-slate-900">
                VELOCITY
              </span>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              FAQ
            </button>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/app'}
              className="text-slate-600 hover:text-slate-900"
            >
              Sign In
            </Button>
            <Button
              onClick={() => window.location.href = '/app'}
              className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-slate-200 bg-white"
        >
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2 text-slate-600 hover:text-slate-900"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-slate-600 hover:text-slate-900"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left py-2 text-slate-600 hover:text-slate-900"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left py-2 text-slate-600 hover:text-slate-900"
            >
              FAQ
            </button>
            <div className="pt-4 space-y-2 border-t border-slate-200">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/app'}
              >
                Sign In
              </Button>
              <Button
                className="w-full bg-sky-600 hover:bg-sky-700"
                onClick={() => window.location.href = '/app'}
              >
                Get Started
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
```

---

## Component 2: `/components/FuturisticHero.tsx`

```tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { motion } from 'motion/react';

export function FuturisticHero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50">
        {/* Bold decorative elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-sky-400/20 to-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-400/20 to-purple-500/20 rounded-full blur-3xl" />
        
        {/* Animated gradient orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-rose-500/30 rounded-full blur-3xl"
        />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge with gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-sm text-white font-medium">
              Join <strong>2,847+</strong> teams
            </span>
          </motion.div>

          {/* Main Title with gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-7xl lg:text-8xl mb-8 leading-[0.95] tracking-tight"
          >
            <span className="block text-slate-900">
              Turn Cold Emails
            </span>
            <span className="block bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
              Into Warm Deals
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-slate-600"
          >
            Send <span className="text-sky-600 font-semibold">100% personalized</span> emails at scale with AI
          </motion.p>

          {/* CTAs with gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            <Button
              onClick={() => window.location.href = '/app'}
              size="lg"
              className="group px-8 py-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-xl shadow-sky-500/30 transition-all"
            >
              <span className="flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            
            <Button
              onClick={() => setShowVideo(true)}
              size="lg"
              variant="outline"
              className="group px-8 py-6 border-2 border-slate-300 hover:border-sky-600 hover:bg-sky-50 transition-all"
            >
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5 text-sky-600" />
                Watch Demo
              </span>
            </Button>
          </motion.div>

          {/* Stats with colorful cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              { value: '3.2M+', label: 'Emails Sent', gradient: 'from-sky-500 to-blue-600', icon: '📧' },
              { value: '847K+', label: 'Replies', gradient: 'from-violet-500 to-purple-600', icon: '💬' },
              { value: '92K+', label: 'Meetings', gradient: 'from-emerald-500 to-teal-600', icon: '📅' },
            ].map((stat, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl md:text-5xl mb-1 text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-white/90">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">Product Demo Video</DialogTitle>
          <DialogDescription className="sr-only">
            Watch a 2-minute demonstration of how our AI-powered email outreach system works
          </DialogDescription>
          <div className="aspect-video rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <p className="text-lg text-slate-900 mb-1">2-Minute Product Demo</p>
              <p className="text-sm text-slate-600">
                Video player would be embedded here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## Component 3: `/components/LogoCloud.tsx`

```tsx
import { motion } from 'motion/react';

const companies = [
  { name: 'Salesforce', width: '160' },
  { name: 'HubSpot', width: '140' },
  { name: 'Stripe', width: '120' },
  { name: 'Atlassian', width: '150' },
  { name: 'Zoom', width: '110' },
  { name: 'Slack', width: '120' },
];

export function LogoCloud() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-xs uppercase tracking-widest text-slate-400 mb-8"
        >
          Trusted by teams at
        </motion.p>
        
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 0.5, y: 0 }}
              whileHover={{ opacity: 1, scale: 1.1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center justify-center"
            >
              <div
                className="text-slate-700 font-semibold transition-all cursor-pointer"
                style={{ width: company.width + 'px' }}
              >
                {company.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Component 4: `/components/BentoFeatures.tsx`

```tsx
import { motion } from 'motion/react';
import { Sparkles, Zap, Target, BarChart3, Clock, Shield, Repeat, Users } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Personalization',
    description: 'Every email uniquely crafted for maximum engagement',
    span: 'md:col-span-2',
    gradient: 'from-sky-500 to-blue-600',
    emoji: '✨',
  },
  {
    icon: Zap,
    title: 'Instant Reply Detection',
    description: 'Never miss a response',
    span: 'md:col-span-1',
    gradient: 'from-amber-500 to-orange-600',
    emoji: '⚡',
  },
  {
    icon: Target,
    title: 'Smart Targeting',
    description: 'Reach the right people at the right time',
    span: 'md:col-span-1',
    gradient: 'from-rose-500 to-pink-600',
    emoji: '🎯',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Track performance with live dashboards and insights',
    span: 'md:col-span-2',
    gradient: 'from-emerald-500 to-teal-600',
    emoji: '📊',
  },
  {
    icon: Clock,
    title: 'Auto-Scheduling',
    description: 'Book meetings automatically',
    span: 'md:col-span-1',
    gradient: 'from-violet-500 to-purple-600',
    emoji: '⏰',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 & GDPR compliant',
    span: 'md:col-span-1',
    gradient: 'from-blue-500 to-indigo-600',
    emoji: '🛡️',
  },
  {
    icon: Repeat,
    title: 'Smart Follow-ups',
    description: 'Automated sequences that feel human',
    span: 'md:col-span-1',
    gradient: 'from-fuchsia-500 to-purple-600',
    emoji: '🔄',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together seamlessly with your entire team',
    span: 'md:col-span-2',
    gradient: 'from-teal-500 to-cyan-600',
    emoji: '👥',
  },
];

export function BentoFeatures() {
  return (
    <section id="features" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-sky-50 text-sky-700 border border-sky-100">
            <Zap className="w-4 h-4" />
            <span className="font-medium">Powerful Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl mb-4 text-slate-900">
            Everything You Need To
            <br />
            <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Close More Deals
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Powerful AI-driven tools designed to help you connect with prospects and convert leads faster
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`${feature.span} group`}
              >
                <motion.div 
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`h-full p-8 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg hover:shadow-2xl transition-all relative overflow-hidden`}
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="text-5xl mb-4">{feature.emoji}</div>
                    <h3 className="text-2xl mb-3 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-white/90 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

---

## ✅ END OF PART 1

**Next files:**
- CODE_PART_2.md will contain Components 5-8
- CODE_PART_3.md will contain Components 9-12
- CODE_PART_4.md will contain Components 13-16
- CODE_PART_5.md will contain Components 17-20
