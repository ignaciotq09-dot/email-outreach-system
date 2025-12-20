import { ReactNode, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface HolographicCardProps {
  children: ReactNode;
  className?: string;
}

export function HolographicCard({ children, className = '' }: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowX, setGlowX] = useState(50);
  const [glowY, setGlowY] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    setGlowX((x / rect.width) * 100);
    setGlowY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlowX(50);
    setGlowY(50);
  };

  return (
    <div className={`relative group ${className}`}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: 1000,
        }}
        className="relative"
      >
        {/* Holographic shine effect */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl overflow-hidden pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(6, 182, 212, 0.4) 0%, transparent 50%)`,
            mixBlendMode: 'screen',
          }}
        />

        {/* Iridescent border */}
        <div 
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(${glowX * 3.6}deg, 
              rgba(6, 182, 212, 0.8), 
              rgba(139, 92, 246, 0.8), 
              rgba(236, 72, 153, 0.8), 
              rgba(6, 182, 212, 0.8))`,
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Reflection/glass effect */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-xl pointer-events-none overflow-hidden"
          style={{
            background: `linear-gradient(${135 + glowX}deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)`,
          }}
        />

        {children}
      </motion.div>

      {/* Glow shadow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-2xl -z-10"
        style={{
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(6, 182, 212, 0.4), transparent 70%)`,
        }}
      />
    </div>
  );
}
