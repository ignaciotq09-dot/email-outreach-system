import { motion } from 'motion/react';
import { Mail, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Sparkles } from 'lucide-react';

const emails = [
  {
    id: 1,
    subject: 'Congrats on the Series B!',
    preview: 'Hi Sarah, saw your announcement...',
    status: 'replied',
    icon: CheckCircle,
    color: 'rgba(16, 185, 129, 1)',
    rotation: -5,
    delay: 0,
  },
  {
    id: 2,
    subject: 'Quick question about your Q4 goals',
    preview: 'Hey Marcus, I noticed your LinkedIn...',
    status: 'opened',
    icon: Clock,
    color: 'rgba(245, 158, 11, 1)',
    rotation: 3,
    delay: 0.1,
  },
  {
    id: 3,
    subject: 'Loved your recent podcast episode',
    preview: 'Hi Emma, your insights on AI were...',
    status: 'interested',
    icon: TrendingUp,
    color: 'rgba(6, 182, 212, 1)',
    rotation: -3,
    delay: 0.2,
  },
];

export function Floating3DEmailCards() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-white/10 backdrop-blur-sm border border-white/20">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Live Campaigns</span>
          </div>
          <h2 className="text-display-lg mb-6 text-white">
            Every Email Is
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
              Uniquely Crafted
            </span>
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-12">
            Watch AI personalization in real-time
          </p>
        </motion.div>

        {/* 3D Floating Email Cards */}
        <div className="relative h-[600px] flex items-center justify-center perspective-1000">
          {emails.map((email, index) => {
            const Icon = email.icon;
            return (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 100, rotateX: -20 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.8, 
                  delay: email.delay,
                  type: 'spring',
                  stiffness: 100,
                }}
                whileHover={{ 
                  z: 100,
                  rotateY: 0,
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
                style={{
                  position: 'absolute',
                  left: `${30 + index * 15}%`,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${email.rotation}deg)`,
                }}
                animate={{
                  y: [0, -20, 0],
                  rotateZ: [email.rotation, email.rotation + 2, email.rotation],
                }}
                transition={{
                  y: {
                    duration: 4 + index,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  rotateZ: {
                    duration: 6 + index,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                }}
                className="w-[340px] cursor-pointer group"
              >
                {/* Card */}
                <div 
                  className="relative rounded-2xl p-6 border-2 backdrop-blur-xl shadow-2xl overflow-hidden"
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    borderColor: email.color + '40',
                    boxShadow: `0 20px 60px ${email.color}20`,
                  }}
                >
                  {/* Glow effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"
                    style={{ backgroundColor: email.color + '40' }}
                  />

                  {/* Scanlines */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.1) 2px, rgba(6, 182, 212, 0.1) 4px)'
                    }}
                  />

                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: email.color + '20',
                        color: email.color,
                        border: `1px solid ${email.color}40`
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="capitalize">{email.status}</span>
                    </div>

                    {/* Pulse */}
                    <div className="relative flex h-3 w-3">
                      <span 
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ backgroundColor: email.color }}
                      ></span>
                      <span 
                        className="relative inline-flex rounded-full h-3 w-3"
                        style={{ backgroundColor: email.color }}
                      ></span>
                    </div>
                  </div>

                  {/* Email content */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          background: email.color + '15',
                          border: `1px solid ${email.color}30`
                        }}
                      >
                        <Mail className="w-5 h-5" style={{ color: email.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white mb-1 truncate">
                          {email.subject}
                        </h4>
                        <p className="text-sm text-slate-400 truncate">
                          {email.preview}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2 pt-3 border-t border-slate-700">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Personalization</span>
                        <span>98%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '98%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: email.delay + 0.5 }}
                          className="h-full rounded-full"
                          style={{ 
                            background: `linear-gradient(to right, ${email.color}, rgba(139, 92, 246, 0.8))`
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700">
                      <div className="text-center">
                        <div className="text-lg" style={{ color: email.color }}>
                          94%
                        </div>
                        <div className="text-xs text-slate-500">Match</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg text-cyan-400">
                          2.3s
                        </div>
                        <div className="text-xs text-slate-500">Response</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg text-violet-400">
                          A+
                        </div>
                        <div className="text-xs text-slate-500">Quality</div>
                      </div>
                    </div>
                  </div>

                  {/* Holographic shimmer */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    style={{
                      background: 'linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
                    }}
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                </div>

                {/* 3D depth shadow */}
                <div 
                  className="absolute inset-0 rounded-2xl -z-10 blur-2xl opacity-50"
                  style={{
                    transform: 'translateZ(-50px)',
                    backgroundColor: email.color + '30',
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-slate-400 mb-6">
            Join thousands of teams sending personalized emails at scale
          </p>
          <button
            onClick={() => window.location.href = '/app'}
            className="group relative px-8 py-4 rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(to right, var(--electric-teal), rgba(139, 92, 246, 1))',
              boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
            }}
          >
            <span className="relative z-10 flex items-center gap-2 text-white">
              Start Creating AI Emails
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </span>
          </button>
        </motion.div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
}