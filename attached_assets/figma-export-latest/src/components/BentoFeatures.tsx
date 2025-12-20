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
          <h2 className="text-display mb-4 text-slate-900">
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