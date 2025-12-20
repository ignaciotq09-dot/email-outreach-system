import { motion } from 'motion/react';

export function AnimatedLogo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const dimensions = {
    small: { container: 32, dots: 2 },
    default: { container: 40, dots: 3 },
    large: { container: 60, dots: 4 }
  };

  const dim = dimensions[size];

  return (
    <div className="relative" style={{ width: dim.container, height: dim.container }}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 blur-md opacity-60 rounded-xl"
        style={{ background: 'linear-gradient(to right, var(--electric-teal), var(--deep-navy))' }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main container */}
      <div className="relative w-full h-full rounded-xl flex items-center justify-center overflow-hidden shadow-brand-medium" style={{ background: 'linear-gradient(to bottom right, var(--electric-teal), var(--deep-navy))' }}>
        {/* Neural network dots */}
        <svg className="w-full h-full p-2" viewBox="0 0 40 40">
          {/* Connection lines */}
          {[
            { x1: 10, y1: 10, x2: 30, y2: 30 },
            { x1: 30, y1: 10, x2: 10, y2: 30 },
            { x1: 20, y1: 10, x2: 20, y2: 30 },
            { x1: 10, y1: 20, x2: 30, y2: 20 },
          ].map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Animated dots */}
          {[
            { cx: 10, cy: 10 },
            { cx: 30, cy: 10 },
            { cx: 20, cy: 20 },
            { cx: 10, cy: 30 },
            { cx: 30, cy: 30 },
          ].map((dot, i) => (
            <motion.circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={dim.dots}
              fill="white"
              initial={{ scale: 0 }}
              animate={{ 
                scale: [0.8, 1.2, 0.8],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Email envelope path */}
          <motion.path
            d="M 12 15 L 20 20 L 28 15 M 12 15 L 12 25 L 28 25 L 28 15"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>
    </div>
  );
}