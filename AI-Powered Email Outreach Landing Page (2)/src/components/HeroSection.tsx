import { useState } from 'react';
import { Button } from './ui/button';
import { Play, CheckCircle2, Sparkles, Zap, TrendingUp, Send } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { motion } from 'motion/react';
import { MeshGradientBackground } from './MeshGradientBackground';
import { FloatingParticles } from './FloatingParticles';
import { MagneticButton } from './MagneticButton';

export function HeroSection() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Mesh Gradient Background */}
        <MeshGradientBackground variant="hero" animated={true} />
        
        {/* Floating Particles */}
        <FloatingParticles count={30} color="teal" />

        {/* Floating Icons with Enhanced Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-[10%]"
            style={{ color: 'rgba(6, 182, 212, 0.2)' }}
            animate={{ 
              y: [0, -30, 0],
              rotate: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-12 h-12" />
          </motion.div>
          <motion.div
            className="absolute top-40 right-[15%]"
            style={{ color: 'rgba(15, 23, 42, 0.2)' }}
            animate={{ 
              y: [0, 25, 0],
              rotate: [0, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Zap className="w-16 h-16" />
          </motion.div>
          <motion.div
            className="absolute bottom-20 left-[20%]"
            style={{ color: 'rgba(6, 182, 212, 0.15)' }}
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 20, 0],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <TrendingUp className="w-14 h-14" />
          </motion.div>
          <motion.div
            className="absolute top-1/2 right-[8%]"
            style={{ color: 'rgba(15, 23, 42, 0.15)' }}
            animate={{ 
              y: [0, 30, 0],
              x: [0, -10, 0],
              rotate: [0, -10, 0],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <Send className="w-10 h-10" />
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border mb-8"
            style={{ borderColor: 'var(--slate-200)' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--electric-teal)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--electric-teal)' }}></span>
            </span>
            <span className="text-sm" style={{ color: 'var(--slate-600)' }}>Trusted by 2,847+ sales teams</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.1,
              type: "spring",
              stiffness: 100,
            }}
            className="text-5xl md:text-7xl mb-6 max-w-4xl mx-auto leading-tight"
            style={{ color: 'var(--deep-navy)' }}
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Turn Cold Emails Into{' '}
            </motion.span>
            <span className="relative inline-block">
              <motion.span 
                className="relative z-10 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_3s_ease-in-out_infinite]"
                style={{ 
                  backgroundImage: 'linear-gradient(to right, var(--electric-teal), var(--deep-navy), var(--electric-teal))'
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                Warm Conversations
              </motion.span>
              <motion.span 
                className="absolute -bottom-2 left-0 right-0 h-3 -rotate-1 -z-10"
                style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)' }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              />
            </span>{' '}
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              With AI
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl mb-10 max-w-3xl mx-auto"
            style={{ color: 'var(--slate-600)' }}
          >
            Send 100% personalized emails at scale, detect replies instantly, and book meetings automatically—all from your Gmail account.
          </motion.p>

          {/* CTAs with Magnetic Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <MagneticButton 
              className="relative text-white shadow-brand-strong hover:shadow-brand-strong transition-all duration-300 group overflow-hidden px-8 py-4 rounded-lg"
              style={{ 
                background: 'linear-gradient(to right, var(--electric-teal), var(--deep-navy))',
                boxShadow: '0 10px 15px rgba(6, 182, 212, 0.3)'
              }}
              onClick={() => window.location.href = '/app'}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>Start Free - No Card Required</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to right, var(--deep-navy), var(--electric-teal))' }}></div>
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            </MagneticButton>
            
            <MagneticButton
              className="gap-2 border-2 group transition-all duration-300 bg-white px-8 py-4 rounded-lg shadow-brand-medium"
              style={{ borderColor: 'var(--slate-200)' }}
              onClick={() => setShowVideo(true)}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Play className="w-5 h-5" style={{ color: 'var(--electric-teal)' }} />
                </motion.div>
                <span style={{ color: 'var(--deep-navy)' }}>See It In Action</span>
              </div>
            </MagneticButton>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
            style={{ color: 'var(--slate-600)' }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success-green)' }} />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success-green)' }} />
              <span>5-minute setup</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-xl" style={{ borderColor: 'var(--slate-200)' }}>
          <div className="aspect-video rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--deep-navy), var(--slate-600))' }}>
            <div className="text-center text-white">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 rounded-full blur-xl opacity-50" style={{ backgroundColor: 'var(--electric-teal)' }}></div>
                <Play className="relative w-20 h-20 opacity-90" />
              </div>
              <p style={{ color: 'var(--slate-200)' }}>2-Minute Demo Video</p>
              <p className="text-sm mt-2" style={{ color: 'var(--slate-400)' }}>
                Video player would be embedded here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
}