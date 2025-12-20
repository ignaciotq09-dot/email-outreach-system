import { motion } from 'motion/react';

interface MeshGradientBackgroundProps {
  variant?: 'hero' | 'section' | 'footer';
  animated?: boolean;
}

export function MeshGradientBackground({ variant = 'section', animated = true }: MeshGradientBackgroundProps) {
  const gradients = {
    hero: {
      colors: [
        'rgba(6, 182, 212, 0.3)',   // Electric Teal
        'rgba(15, 23, 42, 0.2)',    // Deep Navy
        'rgba(148, 163, 184, 0.2)', // Slate 400
      ],
      bg: 'linear-gradient(to bottom right, #F8FAFC, #FFFFFF, #E2E8F0)',
    },
    section: {
      colors: [
        'rgba(6, 182, 212, 0.2)',
        'rgba(148, 163, 184, 0.15)',
      ],
      bg: 'linear-gradient(to bottom right, #FFFFFF, #F8FAFC)',
    },
    footer: {
      colors: [
        'rgba(6, 182, 212, 0.3)',
        'rgba(71, 85, 105, 0.3)',
      ],
      bg: 'linear-gradient(to bottom right, #0F172A, #1E293B)',
    },
  };

  const config = gradients[variant];

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: config.bg }}>
      {/* Mesh gradient blobs */}
      <div className="absolute inset-0">
        {config.colors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl"
            style={{
              backgroundColor: color,
              top: `${(i * 25) % 100}%`,
              left: `${(i * 33) % 100}%`,
            }}
            animate={animated ? {
              x: [0, 100, -50, 0],
              y: [0, -100, 50, 0],
              scale: [1, 1.2, 0.9, 1],
            } : {}}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Dot matrix pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="var(--electric-teal)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50" />
    </div>
  );
}
