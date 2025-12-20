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
          <h2 className="text-display text-slate-900 mb-4">Simple, Transparent Pricing</h2>
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