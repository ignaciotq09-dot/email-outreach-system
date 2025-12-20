import { motion } from 'motion/react';

interface FloatingParticlesProps {
  count?: number;
  color?: 'teal' | 'navy' | 'slate';
}

export function FloatingParticles({ count = 20, color = 'teal' }: FloatingParticlesProps) {
  const colorMap = {
    teal: 'rgba(6, 182, 212, 0.4)',
    navy: 'rgba(15, 23, 42, 0.3)',
    slate: 'rgba(148, 163, 184, 0.3)',
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: colorMap[color],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, -200, -300],
            opacity: [0, 0.6, 0.4, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
