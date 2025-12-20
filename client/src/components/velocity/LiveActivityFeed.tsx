import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const showAndHideCycle = () => {
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
        
        setTimeout(() => {
          setCurrentActivity((prev) => (prev + 1) % activities.length);
        }, 300);
      }, 3000);
    };

    showAndHideCycle();
    const interval = setInterval(showAndHideCycle, 13000);

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
            initial={{ x: -100, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -100, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative rounded-2xl max-w-sm"
            style={{ 
              padding: '2px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #8b5cf6 100%)',
              boxShadow: '0 20px 60px -15px rgba(14, 165, 233, 0.4), 0 10px 30px -10px rgba(99, 102, 241, 0.3)',
            }}
          >
            {/* Inner content with glassmorphism background */}
            <div 
              className="rounded-2xl p-4 backdrop-blur-xl"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              }}
            >
            <div className="flex items-start gap-3">
              {/* Icon with gradient background */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative"
                style={{ 
                  background: `linear-gradient(135deg, ${activity.color}25, ${activity.color}40)`,
                  boxShadow: `0 4px 12px ${activity.color}30`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: activity.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1 text-slate-900">
                  {activity.message}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {activity.location}
                  </span>
                  <span className="text-xs text-slate-400">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
