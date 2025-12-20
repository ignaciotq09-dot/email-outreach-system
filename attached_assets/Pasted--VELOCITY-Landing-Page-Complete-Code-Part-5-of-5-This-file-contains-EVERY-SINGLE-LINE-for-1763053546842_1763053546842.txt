# VELOCITY Landing Page - Complete Code Part 5 of 5

## ✅ This file contains EVERY SINGLE LINE for:
- Component 17: Footer.tsx
- Component 18: StickyCtaBar.tsx
- Component 19: LiveActivityFeed.tsx
- Component 20: ExitIntentPopup.tsx

---

## Component 17: `/components/Footer.tsx`

```tsx
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Integrations', href: '#' },
    ],
    company: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
    legal: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'GDPR', href: '#' },
    ],
  };

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-12 grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="font-bold text-lg text-white">
                VELOCITY
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Email outreach that doesn't feel like outreach. Transform cold emails into warm conversations with AI.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Mail, href: '#', label: 'Email' },
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-sky-600 flex items-center justify-center transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-sky-500 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-sky-500 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-sky-500 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>
            © {new Date().getFullYear()} Velocity. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-sky-500 transition-colors">
              Status
            </a>
            <a href="#" className="hover:text-sky-500 transition-colors">
              Changelog
            </a>
            <a href="#" className="hover:text-sky-500 transition-colors">
              API Docs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## Component 18: `/components/StickyCtaBar.tsx`

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { X, Zap } from 'lucide-react';

export function StickyCtaBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 800px
      if (window.scrollY > 800 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
        >
          <div 
            className="max-w-5xl mx-auto rounded-xl shadow-2xl backdrop-blur-xl border-2 p-4"
            style={{ 
              background: 'linear-gradient(to right, var(--deep-navy), var(--electric-teal))',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-white flex-1">
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm sm:text-base">
                    <span className="hidden sm:inline">🎉 </span>
                    <strong>Start sending personalized emails today</strong>
                    <span className="hidden sm:inline"> — No credit card required</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => window.location.href = '/app'}
                  className="bg-white text-deep-navy hover:bg-slate-100 shadow-lg px-6 py-2 rounded-lg"
                  style={{ color: 'var(--deep-navy)' }}
                >
                  Get Started Free
                </Button>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Component 19: `/components/LiveActivityFeed.tsx`

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, UserPlus, Calendar, TrendingUp } from 'lucide-react';

const activities = [
  { 
    type: 'signup', 
    message: 'Sarah from TechCorp started a free trial',
    icon: UserPlus,
    color: 'var(--electric-teal)',
    location: 'San Francisco, CA'
  },
  { 
    type: 'meeting', 
    message: 'Marcus booked 3 meetings in the last hour',
    icon: Calendar,
    color: 'var(--success-green)',
    location: 'New York, NY'
  },
  { 
    type: 'achievement', 
    message: 'Jessica hit 100 responses this week',
    icon: TrendingUp,
    color: 'var(--warning-amber)',
    location: 'Austin, TX'
  },
  { 
    type: 'signup', 
    message: 'David from GrowthLabs upgraded to Pro',
    icon: CheckCircle2,
    color: 'var(--info-blue)',
    location: 'Seattle, WA'
  },
  { 
    type: 'meeting', 
    message: 'Emma booked a demo call',
    icon: Calendar,
    color: 'var(--success-green)',
    location: 'Boston, MA'
  },
  { 
    type: 'signup', 
    message: 'Michael started using VELOCITY',
    icon: UserPlus,
    color: 'var(--electric-teal)',
    location: 'Chicago, IL'
  },
];

export function LiveActivityFeed() {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentActivity((prev) => (prev + 1) % activities.length);
        setIsVisible(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const activity = activities[currentActivity];
  const Icon = activity.icon;

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden lg:block">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={currentActivity}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-white rounded-xl shadow-2xl border-2 p-4 max-w-sm backdrop-blur-xl"
            style={{ 
              borderColor: 'var(--slate-200)',
              background: 'rgba(255, 255, 255, 0.95)'
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: activity.color + '20',
                }}
              >
                <Icon className="w-5 h-5" style={{ color: activity.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm mb-1" style={{ color: 'var(--deep-navy)' }}>
                  {activity.message}
                </p>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs"
                    style={{ color: 'var(--slate-400)' }}
                  >
                    {activity.location}
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: 'var(--slate-400)' }}
                  >
                    • Just now
                  </span>
                </div>
              </div>

              {/* Pulse indicator */}
              <div className="relative flex h-3 w-3 flex-shrink-0">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: activity.color }}
                ></span>
                <span 
                  className="relative inline-flex rounded-full h-3 w-3"
                  style={{ backgroundColor: activity.color }}
                ></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## Component 20: `/components/ExitIntentPopup.tsx`

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse leaves from top of viewport
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
      }
    };

    // Only add listener on desktop
    if (window.innerWidth > 768) {
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="max-w-lg border-0 p-0 overflow-hidden"
        style={{ backgroundColor: 'transparent' }}
      >
        <DialogTitle className="sr-only">Special Offer - Don't Leave Yet</DialogTitle>
        <DialogDescription className="sr-only">
          Start your free trial and get your first 100 AI-personalized emails on us. No credit card required, 5-minute setup, cancel anytime.
        </DialogDescription>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative overflow-hidden rounded-2xl"
        >
          {/* Background gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, var(--electric-teal) 0%, var(--deep-navy) 100%)'
            }}
          ></div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 text-center text-white">
            {/* Icon */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Gift className="w-10 h-10" />
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl mb-3"
            >
              Wait! Don't Leave Yet 👋
            </motion.h3>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg mb-6 text-white/90"
            >
              Start your free trial and get your first{' '}
              <span className="inline-flex items-center gap-1">
                <strong>100 AI-personalized emails</strong>
                <Sparkles className="w-4 h-4 inline" />
              </span>
              {' '}on us!
            </motion.p>

            {/* Benefits */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-8 space-y-2 text-left inline-block"
            >
              {[
                '✨ No credit card required',
                '⚡ 5-minute setup',
                '🎯 Cancel anytime',
              ].map((benefit, i) => (
                <div key={i} className="text-white/90">
                  {benefit}
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                onClick={() => {
                  window.location.href = '/app';
                }}
                className="flex-1 bg-white text-deep-navy hover:bg-slate-100 shadow-lg px-8 py-6 rounded-lg"
                style={{ color: 'var(--deep-navy)' }}
              >
                Claim My Free Trial
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                className="text-white hover:bg-white/10 px-8 py-6 rounded-lg"
              >
                Maybe Later
              </Button>
            </motion.div>

            {/* Trust badge */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-white/70 mt-6"
            >
              Join 2,847+ teams already using VELOCITY
            </motion.p>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-20"
          >
            <X className="w-6 h-6" />
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## ✅ END OF PART 5 - ALL CODE COMPLETE!

**You now have ALL 5 files containing EVERY SINGLE LINE of code:**
- CODE_PART_1.md - App.tsx, globals.css, Components 1-4
- CODE_PART_2.md - Components 5-8
- CODE_PART_3.md - Components 9-12
- CODE_PART_4.md - Components 13-16
- CODE_PART_5.md - Components 17-20

**To get the complete working application:**
Download all 5 files (CODE_PART_1.md through CODE_PART_5.md) and you'll have every single line of code for all components, styles, and the main App file. No code has been omitted - this is 100% complete!
