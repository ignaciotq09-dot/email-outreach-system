import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Brain, Target, RefreshCw, Calendar, BarChart3, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { TiltCard } from './TiltCard';

const features = [
  {
    icon: Brain,
    title: 'AI That Writes Like You',
    description:
      'GPT-5 learns your voice and creates unique emails for each recipient. No more templates that sound robotic.',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Target,
    title: '4-Layer Reply Detection',
    description:
      "Never miss a response. Our system catches replies across threads, aliases, and domains with 99.7% accuracy.",
    gradient: 'from-fuchsia-500 to-pink-600',
    bg: 'bg-fuchsia-50',
  },
  {
    icon: RefreshCw,
    title: 'Automated Follow-Ups',
    description:
      'Smart 3-stage sequences (3, 13, 21 days) that stop when prospects reply. Different tone each time.',
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Calendar,
    title: 'Meeting Auto-Scheduler',
    description:
      'AI detects appointment requests and creates Google Calendar events instantly. No back-and-forth.',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: BarChart3,
    title: 'Campaign Analytics',
    description:
      "Track open rates, reply rates, and conversion metrics. See what's working in real-time.",
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50',
  },
  {
    icon: Mail,
    title: 'Gmail Native',
    description:
      'Works directly with your Gmail. No new email service to learn. Your domain, your reputation.',
    gradient: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-100 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-100 rounded-full filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-700 mb-4">
            Powerful Features
          </div>
          <h2 className="text-4xl md:text-5xl text-center text-gray-900 mb-4">
            Everything You Need In One Platform
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                }}
              >
                <TiltCard className="h-full">
                  <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm h-full overflow-hidden relative">
                    {/* Gradient Border Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}></div>
                    <div className="absolute inset-[2px] bg-white rounded-lg z-0"></div>
                    
                    {/* Shimmer effect on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 -z-10"
                      animate={{ x: ['-200%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    />
                    
                    <CardHeader className="relative z-10">
                      <div className="relative inline-block mb-4">
                        <motion.div 
                          className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity`}
                          whileHover={{ scale: 1.2 }}
                        />
                        <motion.div 
                          className={`relative w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center`}
                          whileHover={{ 
                            scale: 1.1,
                            rotate: [0, -10, 10, -10, 0],
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className={`w-7 h-7 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`} style={{ WebkitTextStroke: '1px currentColor', WebkitTextFillColor: 'transparent' }} />
                        </motion.div>
                      </div>
                      <CardTitle className="text-gray-900">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <CardDescription className="text-base text-gray-600 leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
