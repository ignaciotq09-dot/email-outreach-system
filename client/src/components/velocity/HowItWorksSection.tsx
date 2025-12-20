import { Upload, Wand2, Send, Bell, Workflow } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmailFlowVisualization } from './EmailFlowVisualization';

const steps = [
  {
    icon: Upload,
    title: 'Add your contacts',
    description: 'Copy and paste from anywhere. We will figure out the names, emails, and companies.',
    gradient: 'from-violet-500 to-purple-600',
    color: 'violet',
  },
  {
    icon: Wand2,
    title: 'Write your message once',
    description: 'AI makes a personal version for each person.',
    gradient: 'from-fuchsia-500 to-pink-600',
    color: 'fuchsia',
  },
  {
    icon: Send,
    title: 'Send from Gmail',
    description: 'It goes out from your own email. You can watch it happen live.',
    gradient: 'from-blue-500 to-cyan-600',
    color: 'blue',
  },
  {
    icon: Bell,
    title: 'Get replies',
    description: 'We will text you when someone responds. Meetings get booked automatically.',
    gradient: 'from-emerald-500 to-teal-600',
    color: 'emerald',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-gradient-to-br from-gray-50 to-violet-50/30 relative overflow-hidden">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-sky-50 text-sky-700 border border-sky-100">
            <Workflow className="w-4 h-4" />
            <span>How it works</span>
          </div>
          <h2 className="text-display text-center text-gray-900 mb-8">
            Here's how you go from a contact list to booked meetings
          </h2>
        </motion.div>

        {/* Email Flow Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <EmailFlowVisualization />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative"
              >
                {/* Connection Line - Desktop only */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[60%] w-[calc(100%-20%)] z-0">
                    <svg className="w-full h-4" viewBox="0 0 100 20" preserveAspectRatio="none">
                      <motion.path
                        d="M0,10 Q50,0 100,10"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="5,5"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}

                <div className="relative z-10 text-center">
                  {/* Icon Container with Enhanced Animation */}
                  <div className="relative inline-block mb-6">
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-r ${step.gradient} rounded-2xl blur-xl opacity-60`}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.6, 0.8, 0.6],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.5,
                      }}
                    />
                    <motion.div 
                      className={`relative w-32 h-32 bg-gradient-to-r ${step.gradient} rounded-2xl flex items-center justify-center shadow-2xl`}
                      whileHover={{ 
                        scale: 1.15,
                        rotate: [0, -5, 5, -5, 0],
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <motion.div
                        animate={{
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3,
                        }}
                      >
                        <Icon className="w-14 h-14 text-white" strokeWidth={1.5} />
                      </motion.div>
                    </motion.div>
                    
                    {/* Step Number Badge with Pulse */}
                    <motion.div 
                      className={`absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-${step.color}-200`}
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.4,
                      }}
                    >
                      <span className={`bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent`}>
                        {index + 1}
                      </span>
                    </motion.div>
                  </div>

                  <h3 className="text-xl text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}