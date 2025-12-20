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
