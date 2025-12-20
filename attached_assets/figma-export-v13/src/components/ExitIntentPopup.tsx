import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse leaves from top of viewport
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
      }
    };

    // Only add listener on desktop
    if (window.innerWidth > 768) {
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="max-w-lg border-0 p-0 overflow-hidden"
        style={{ backgroundColor: 'transparent' }}
      >
        <DialogTitle className="sr-only">Special Offer - Don't Leave Yet</DialogTitle>
        <DialogDescription className="sr-only">
          Start your free trial and get your first 100 AI-personalized emails on us. No credit card required, 5-minute setup, cancel anytime.
        </DialogDescription>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative overflow-hidden rounded-2xl"
        >
          {/* Background gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, var(--electric-teal) 0%, var(--deep-navy) 100%)'
            }}
          ></div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 text-center text-white">
            {/* Icon */}
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Gift className="w-10 h-10" />
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl mb-3"
            >
              Wait! Don't Leave Yet 👋
            </motion.h3>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg mb-6 text-white/90"
            >
              Start your free trial and get your first{' '}
              <span className="inline-flex items-center gap-1">
                <strong>100 AI-personalized emails</strong>
                <Sparkles className="w-4 h-4 inline" />
              </span>
              {' '}on us!
            </motion.p>

            {/* Benefits */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-8 space-y-2 text-left inline-block"
            >
              {[
                '✨ No credit card required',
                '⚡ 5-minute setup',
                '🎯 Cancel anytime',
              ].map((benefit, i) => (
                <div key={i} className="text-white/90">
                  {benefit}
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                onClick={() => {
                  window.location.href = '/app';
                }}
                className="flex-1 bg-white text-deep-navy hover:bg-slate-100 shadow-lg px-8 py-6 rounded-lg"
                style={{ color: 'var(--deep-navy)' }}
              >
                Claim My Free Trial
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                className="text-white hover:bg-white/10 px-8 py-6 rounded-lg"
              >
                Maybe Later
              </Button>
            </motion.div>

            {/* Trust badge */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-white/70 mt-6"
            >
              Join 2,847+ teams already using VELOCITY
            </motion.p>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-20"
          >
            <X className="w-6 h-6" />
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}