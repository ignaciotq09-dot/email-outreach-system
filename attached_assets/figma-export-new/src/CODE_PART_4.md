# VELOCITY Landing Page - Complete Code Part 4 of 5

## ✅ This file contains EVERY SINGLE LINE for:
- Component 13: PricingSection.tsx
- Component 14: SecurityBadges.tsx
- Component 15: FAQSection.tsx
- Component 16: CTASection.tsx

---

## Component 13: `/components/PricingSection.tsx`

```tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Check, Zap, Rocket, Crown } from 'lucide-react';
import { motion } from 'motion/react';

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      icon: Zap,
      price: 0,
      features: [
        '50 emails/month',
        'Basic personalization',
        'Reply detection',
        'Email support',
      ],
      cta: 'Start Free',
      popular: false,
      gradient: 'from-slate-600 to-slate-700',
    },
    {
      name: 'Pro',
      icon: Rocket,
      monthlyPrice: 49,
      annualPrice: 39,
      features: [
        '2,000 emails/month',
        'Advanced AI personalization',
        'All features included',
        'Priority support',
      ],
      cta: 'Start Building Campaigns',
      popular: true,
      gradient: 'from-sky-600 to-blue-700',
    },
    {
      name: 'Scale',
      icon: Crown,
      monthlyPrice: 149,
      annualPrice: 119,
      features: [
        'Unlimited emails',
        'Custom AI training',
        'Dedicated success manager',
        'API access',
      ],
      cta: 'Book a Demo',
      popular: false,
      gradient: 'from-violet-600 to-purple-700',
    },
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.price !== undefined) return plan.price;
    return isAnnual ? plan.annualPrice : plan.monthlyPrice;
  };

  const handleCTA = (planName: string) => {
    if (planName === 'Scale') {
      window.open('https://calendly.com', '_blank');
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <section id="pricing" className="py-20 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-sky-50 text-sky-700 border border-sky-100 mb-4">
            Flexible Pricing
          </div>
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-slate-600 mb-8">
            Choose the perfect plan for your team
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-white border border-slate-200 rounded-full">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full transition-all ${
                !isAnnual
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full transition-all ${
                isAnnual
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = getPrice(plan);
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${
                  plan.popular ? 'md:-mt-4 md:mb-0' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm shadow-lg">
                    ⭐ Most Popular
                  </div>
                )}
                
                <div
                  className={`h-full p-8 rounded-2xl bg-white border-2 ${
                    plan.popular
                      ? 'border-sky-600 shadow-xl'
                      : 'border-slate-200 hover:border-slate-300'
                  } transition-all`}
                >
                  <div className="mb-6">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl text-slate-900 mb-2 font-light">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl text-slate-900 font-light">${price}</span>
                      {plan.price !== 0 && (
                        <span className="text-slate-500">
                          /{isAnnual ? 'mo' : 'month'}
                        </span>
                      )}
                    </div>
                    {isAnnual && plan.price !== 0 && (
                      <p className="text-sm text-slate-500 mt-1">
                        Billed annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleCTA(plan.name)}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-sky-600 hover:bg-sky-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>
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

## Component 14: `/components/SecurityBadges.tsx`

```tsx
import { motion } from 'motion/react';
import { Shield, Lock, CheckCircle2, Award } from 'lucide-react';

const badges = [
  {
    icon: Shield,
    title: 'SOC 2 Certified',
    description: 'Enterprise-grade security',
    color: 'var(--info-blue)'
  },
  {
    icon: Lock,
    title: 'GDPR Compliant',
    description: 'Data privacy guaranteed',
    color: 'var(--success-green)'
  },
  {
    icon: CheckCircle2,
    title: '256-bit Encryption',
    description: 'Bank-level security',
    color: 'var(--electric-teal)'
  },
  {
    icon: Award,
    title: '99.9% Uptime',
    description: 'Always available',
    color: 'var(--warning-amber)'
  },
];

export function SecurityBadges() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h3 className="text-2xl mb-2" style={{ color: 'var(--deep-navy)' }}>
            Enterprise-Grade Security & Compliance
          </h3>
          <p style={{ color: 'var(--slate-600)' }}>
            Your data is protected by industry-leading security standards
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-white shadow-brand-medium hover:shadow-brand-strong transition-all duration-300 hover:-translate-y-1"
              >
                <div 
                  className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: badge.color + '15'
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: badge.color }} />
                </div>
                <h4 className="text-sm mb-1" style={{ color: 'var(--deep-navy)' }}>
                  {badge.title}
                </h4>
                <p className="text-xs" style={{ color: 'var(--slate-500)' }}>
                  {badge.description}
                </p>
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

## Component 15: `/components/FAQSection.tsx`

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { motion } from 'motion/react';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How does the AI personalization work?',
    answer:
      'Our AI analyzes your writing style from sample emails and learns your tone, vocabulary, and messaging patterns. It then generates unique emails for each recipient based on their profile, company, and context—ensuring every message feels personally written.',
  },
  {
    question: 'Will emails be sent from my Gmail account?',
    answer:
      'Yes! The system connects directly to your Gmail account via secure OAuth. All emails are sent from your actual email address, maintaining your domain reputation and ensuring deliverability.',
  },
  {
    question: 'What happens if someone replies?',
    answer:
      'Our 4-layer reply detection system monitors responses across all threads and automatically stops any scheduled follow-ups. You receive instant notifications via email and SMS, and the AI can even book meetings directly to your calendar if requested.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. There are no contracts or commitments. You can upgrade, downgrade, or cancel your subscription at any time from your account settings. The free plan is available forever with no credit card required.',
  },
  {
    question: 'How accurate is the reply detection?',
    answer:
      'Our reply detection has a 99.7% accuracy rate. It monitors primary inbox, threaded replies, different email aliases, and even catches responses that come from forwarded emails or different domains within the same organization.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-sky-50 text-sky-700 border border-sky-100 mb-4">
            💡 FAQ
          </div>
          <h2 className="text-4xl md:text-5xl text-slate-900 mb-4">
            Questions? <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Answered.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-2 border-slate-200 rounded-xl px-6 bg-white hover:border-sky-300 hover:shadow-md transition-all"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="text-slate-900">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center p-8 bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl border-2 border-sky-200"
        >
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-slate-900 mb-2">
            Still have questions?
          </p>
          <p className="text-slate-600 mb-6 text-sm">
            Can't find the answer you're looking for? Please chat to our friendly team.
          </p>
          <a
            href="mailto:support@velocity.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-sky-500/30"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  );
}
```

---

## Component 16: `/components/CTASection.tsx`

```tsx
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <span className="text-white text-sm">🚀 Ready to Get Started?</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl text-white mb-6">
            Ready to <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">close more deals?</span>
          </h2>

          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Start free, no credit card required
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-xl shadow-sky-500/30 transition-all group px-8"
              asChild
            >
              <a href="/app">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all px-8"
              onClick={() => window.open('https://calendly.com', '_blank')}
            >
              Book a Demo
            </Button>
          </div>

          {/* Trust Indicators with icons */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white">4.8/5 Rating</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-white">Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-white">5-Minute Setup</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

---

## ✅ END OF PART 4

**Next file:**
- CODE_PART_5.md will contain Components 17-20 (Footer, StickyCtaBar, LiveActivityFeed, ExitIntentPopup)
