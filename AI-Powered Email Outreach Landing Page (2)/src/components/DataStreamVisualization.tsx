import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export function DataStreamVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Data particles
    interface Particle {
      x: number;
      y: number;
      speed: number;
      size: number;
      opacity: number;
      char: string;
    }

    const columns = Math.floor(canvas.width / 20);
    const particles: Particle[] = [];

    // Create initial particles
    for (let i = 0; i < columns; i++) {
      particles.push({
        x: i * 20,
        y: Math.random() * canvas.height,
        speed: 1 + Math.random() * 2,
        size: 12,
        opacity: Math.random(),
        char: String.fromCharCode(33 + Math.floor(Math.random() * 94)),
      });
    }

    const draw = () => {
      // Fade effect
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update
        particle.y += particle.speed;
        if (particle.y > canvas.height) {
          particle.y = -20;
          particle.char = String.fromCharCode(33 + Math.floor(Math.random() * 94));
        }

        // Random character change
        if (Math.random() < 0.05) {
          particle.char = String.fromCharCode(33 + Math.floor(Math.random() * 94));
        }

        // Draw character
        ctx.font = `${particle.size}px monospace`;
        const isHighlighted = Math.random() < 0.1;
        
        if (isHighlighted) {
          ctx.fillStyle = `rgba(6, 182, 212, ${particle.opacity})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
        } else {
          ctx.fillStyle = `rgba(6, 182, 212, ${particle.opacity * 0.3})`;
          ctx.shadowBlur = 0;
        }
        
        ctx.fillText(particle.char, particle.x, particle.y);
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${100 + i * 50}px`,
            height: `${100 + i * 50}px`,
            background: `radial-gradient(circle, rgba(6, 182, 212, ${0.1 - i * 0.02}) 0%, transparent 70%)`,
            left: `${20 + i * 15}%`,
            top: `${10 + i * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Inner glow */}
          <div 
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              background: `radial-gradient(circle, rgba(6, 182, 212, ${0.15 - i * 0.03}) 0%, transparent 60%)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
