import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { X, Zap } from 'lucide-react';

export function StickyCtaBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 800px
      if (window.scrollY > 800 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
        >
          <div 
            className="max-w-5xl mx-auto rounded-xl shadow-2xl backdrop-blur-xl border-2 p-4"
            style={{ 
              background: 'linear-gradient(to right, var(--deep-navy), var(--electric-teal))',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 text-white flex-1">
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm sm:text-base">
                    <span className="hidden sm:inline">🎉 </span>
                    <strong>Start sending personalized emails today</strong>
                    <span className="hidden sm:inline"> — No credit card required</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => window.location.href = '/app'}
                  className="bg-white text-deep-navy hover:bg-slate-100 shadow-lg px-6 py-2 rounded-lg"
                  style={{ color: 'var(--deep-navy)' }}
                >
                  Get Started Free
                </Button>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  aria-label="Dismiss"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
