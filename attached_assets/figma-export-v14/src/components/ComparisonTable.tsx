import { motion } from 'motion/react';
import { Check, X, Zap, Shield } from 'lucide-react';
import { Card } from './ui/card';
import React from 'react';

const features = [
  { 
    category: 'Core Features',
    items: [
      { name: 'AI Personalization', velocity: true, competitor1: 'Basic', competitor2: false },
      { name: 'Reply Detection', velocity: 'Real-time', competitor1: 'Delayed', competitor2: 'Basic' },
      { name: 'Gmail Integration', velocity: true, competitor1: true, competitor2: false },
      { name: 'Auto-scheduling', velocity: true, competitor1: false, competitor2: false },
    ]
  },
  {
    category: 'Limits & Scale',
    items: [
      { name: 'Email Sending', velocity: 'Unlimited*', competitor1: '1,000/mo', competitor2: '500/mo' },
      { name: 'Team Members', velocity: 'Unlimited', competitor1: '5 users', competitor2: '3 users' },
      { name: 'API Access', velocity: true, competitor1: 'Enterprise only', competitor2: false },
    ]
  },
  {
    category: 'Support & Training',
    items: [
      { name: 'Support', velocity: '24/7 Chat', competitor1: 'Email only', competitor2: 'Email only' },
      { name: 'Onboarding', velocity: 'Dedicated', competitor1: 'Self-serve', competitor2: 'Self-serve' },
      { name: 'Custom Training', velocity: true, competitor1: false, competitor2: false },
    ]
  },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-6 h-6 mx-auto" style={{ color: 'var(--success-green)' }} />
    ) : (
      <X className="w-6 h-6 mx-auto" style={{ color: 'var(--slate-400)' }} />
    );
  }
  return (
    <span className="text-sm" style={{ color: 'var(--deep-navy)' }}>
      {value}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-sky-50 text-sky-700 border border-sky-100">
            <Shield className="w-4 h-4" />
            <span>Why VELOCITY</span>
          </div>
          <h2 className="text-display mb-4" style={{ color: 'var(--deep-navy)' }}>
            See How We Compare
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--slate-600)' }}>
            More features, better support, and unbeatable value
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="overflow-hidden shadow-brand-strong border-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2" style={{ borderColor: 'var(--slate-200)' }}>
                    <th className="text-left p-6 w-1/3" style={{ color: 'var(--slate-600)' }}>
                      Features
                    </th>
                    <th className="p-6 w-1/4">
                      <div className="flex flex-col items-center">
                        <div 
                          className="flex items-center gap-2 px-4 py-2 rounded-lg mb-2"
                          style={{ 
                            background: 'linear-gradient(to right, var(--electric-teal), var(--deep-navy))'
                          }}
                        >
                          <Zap className="w-5 h-5 text-white" />
                          <span className="velocity-logo text-white">VELOCITY</span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--success-green)' }}>
                          Best Value
                        </span>
                      </div>
                    </th>
                    <th className="p-6 w-1/4 text-center" style={{ color: 'var(--slate-600)' }}>
                      Competitor A
                    </th>
                    <th className="p-6 w-1/4 text-center" style={{ color: 'var(--slate-600)' }}>
                      Competitor B
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((category, catIndex) => (
                    <React.Fragment key={`category-${catIndex}`}>
                      <tr>
                        <td 
                          colSpan={4} 
                          className="p-4 text-sm uppercase tracking-wide"
                          style={{ 
                            backgroundColor: 'var(--slate-50)',
                            color: 'var(--slate-600)'
                          }}
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.items.map((item, itemIndex) => (
                        <motion.tr
                          key={`item-${catIndex}-${itemIndex}`}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: itemIndex * 0.05 }}
                          className="border-b hover:bg-slate-50/50 transition-colors"
                          style={{ borderColor: 'var(--slate-200)' }}
                        >
                          <td className="p-4" style={{ color: 'var(--deep-navy)' }}>
                            {item.name}
                          </td>
                          <td 
                            className="p-4 text-center"
                            style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)' }}
                          >
                            <CellValue value={item.velocity} />
                          </td>
                          <td className="p-4 text-center" style={{ color: 'var(--slate-600)' }}>
                            <CellValue value={item.competitor1} />
                          </td>
                          <td className="p-4 text-center" style={{ color: 'var(--slate-600)' }}>
                            <CellValue value={item.competitor2} />
                          </td>
                        </motion.tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div 
              className="p-4 text-center text-sm border-t"
              style={{ 
                backgroundColor: 'var(--slate-50)',
                color: 'var(--slate-600)',
                borderColor: 'var(--slate-200)'
              }}
            >
              * On Scale plan. All plans include core features with different volume limits.
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}