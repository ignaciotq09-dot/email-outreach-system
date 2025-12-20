import { useState } from 'react';
import { Button } from './ui/button';
import { Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { motion } from 'motion/react';

export function FuturisticHero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-sky-50">
        {/* Bold decorative elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-sky-400/20 to-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-400/20 to-purple-500/20 rounded-full blur-3xl" />
        
        {/* Animated gradient orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-400/30 to-rose-500/30 rounded-full blur-3xl"
        />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge with gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-sm text-white font-medium">
              Join <strong>2,847+</strong> teams
            </span>
          </motion.div>

          {/* Main Title with gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-7xl lg:text-8xl mb-8 leading-[0.95] tracking-tight"
          >
            <span className="block text-slate-900">
              Turn Cold Emails
            </span>
            <span className="block bg-gradient-to-r from-sky-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
              Into Warm Deals
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-slate-600"
          >
            Send <span className="text-sky-600 font-semibold">100% personalized</span> emails at scale with AI
          </motion.p>

          {/* CTAs with gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            <Button
              onClick={() => window.location.href = '/app'}
              size="lg"
              className="group px-8 py-6 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-xl shadow-sky-500/30 transition-all"
            >
              <span className="flex items-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            
            <Button
              onClick={() => setShowVideo(true)}
              size="lg"
              variant="outline"
              className="group px-8 py-6 border-2 border-slate-300 hover:border-sky-600 hover:bg-sky-50 transition-all"
            >
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5 text-sky-600" />
                Watch Demo
              </span>
            </Button>
          </motion.div>

          {/* Stats with colorful cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              { value: '3.2M+', label: 'Emails Sent', gradient: 'from-sky-500 to-blue-600', icon: '📧' },
              { value: '847K+', label: 'Replies', gradient: 'from-violet-500 to-purple-600', icon: '💬' },
              { value: '92K+', label: 'Meetings', gradient: 'from-emerald-500 to-teal-600', icon: '📅' },
            ].map((stat, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`p-6 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl md:text-5xl mb-1 text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-white/90">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">Product Demo Video</DialogTitle>
          <DialogDescription className="sr-only">
            Watch a 2-minute demonstration of how our AI-powered email outreach system works
          </DialogDescription>
          <div className="aspect-video rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <p className="text-lg text-slate-900 mb-1">2-Minute Product Demo</p>
              <p className="text-sm text-slate-600">
                Video player would be embedded here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}