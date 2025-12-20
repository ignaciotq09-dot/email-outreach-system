import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, UserPlus, Calendar, TrendingUp } from 'lucide-react';

const activities = [
  { 
    type: 'signup', 
    message: 'Sarah from TechCorp started a free trial',
    icon: UserPlus,
    color: 'var(--electric-teal)',
    location: 'San Francisco, CA'
  },
  { 
    type: 'meeting', 
    message: 'Marcus booked 3 meetings in the last hour',
    icon: Calendar,
    color: 'var(--success-green)',
    location: 'New York, NY'
  },
  { 
    type: 'achievement', 
    message: 'Jessica hit 100 responses this week',
    icon: TrendingUp,
    color: 'var(--warning-amber)',
    location: 'Austin, TX'
  },
  { 
    type: 'signup', 
    message: 'David from GrowthLabs upgraded to Pro',
    icon: CheckCircle2,
    color: 'var(--info-blue)',
    location: 'Seattle, WA'
  },
  { 
    type: 'meeting', 
    message: 'Emma booked a demo call',
    icon: Calendar,
    color: 'var(--success-green)',
    location: 'Boston, MA'
  },
  { 
    type: 'signup', 
    message: 'Michael started using VELOCITY',
    icon: UserPlus,
    color: 'var(--electric-teal)',
    location: 'Chicago, IL'
  },
];

export function LiveActivityFeed() {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentActivity((prev) => (prev + 1) % activities.length);
        setIsVisible(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const activity = activities[currentActivity];
  const Icon = activity.icon;

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden lg:block">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={currentActivity}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-white rounded-xl shadow-2xl border-2 p-4 max-w-sm backdrop-blur-xl"
            style={{ 
              borderColor: 'var(--slate-200)',
              background: 'rgba(255, 255, 255, 0.95)'
            }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: activity.color + '20',
                }}
              >
                <Icon className="w-5 h-5" style={{ color: activity.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm mb-1" style={{ color: 'var(--deep-navy)' }}>
                  {activity.message}
                </p>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs"
                    style={{ color: 'var(--slate-400)' }}
                  >
                    {activity.location}
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: 'var(--slate-400)' }}
                  >
                    • Just now
                  </span>
                </div>
              </div>

              {/* Pulse indicator */}
              <div className="relative flex h-3 w-3 flex-shrink-0">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: activity.color }}
                ></span>
                <span 
                  className="relative inline-flex rounded-full h-3 w-3"
                  style={{ backgroundColor: activity.color }}
                ></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
