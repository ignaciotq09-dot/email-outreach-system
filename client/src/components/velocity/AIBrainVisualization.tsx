import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Brain, Zap, Mail, User } from 'lucide-react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  active: boolean;
}

export function AIBrainVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();

    // Create neural network nodes
    const nodeCount = 24;
    const nodes: Node[] = [];
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 80 + Math.random() * 100;
      nodes.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        connections: [],
        active: false,
      });
    }

    // Create connections
    nodes.forEach((node, i) => {
      const connectionCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < connectionCount; j++) {
        const targetIndex = Math.floor(Math.random() * nodeCount);
        if (targetIndex !== i && !node.connections.includes(targetIndex)) {
          node.connections.push(targetIndex);
        }
      }
    });

    let pulsePhase = 0;
    let activationWave = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Update nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.offsetWidth) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.offsetHeight) node.vy *= -1;

        // Drift toward center
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * 0.0001;
        node.vy += dy * 0.0001;
      });

      // Draw connections
      nodes.forEach((node, i) => {
        node.connections.forEach((targetIndex) => {
          const target = nodes[targetIndex];
          const distance = Math.sqrt(
            Math.pow(target.x - node.x, 2) + Math.pow(target.y - node.y, 2)
          );

          // Activation pulse
          const pulseValue = Math.sin(pulsePhase + i * 0.3) * 0.5 + 0.5;
          const isActive = pulseValue > 0.7;

          // Draw connection
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);

          if (isActive) {
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.6 * pulseValue})`;
            ctx.lineWidth = 2;

            // Draw glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
          } else {
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
          }

          ctx.stroke();
          ctx.shadowBlur = 0;

          // Draw pulse traveling along line
          if (isActive) {
            const progress = (pulsePhase * 10 + i) % 1;
            const pulseX = node.x + (target.x - node.x) * progress;
            const pulseY = node.y + (target.y - node.y) * progress;

            const gradient = ctx.createRadialGradient(
              pulseX, pulseY, 0,
              pulseX, pulseY, 8
            );
            gradient.addColorStop(0, 'rgba(6, 182, 212, 1)');
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });

      // Draw nodes
      nodes.forEach((node, i) => {
        const pulseValue = Math.sin(pulsePhase + i * 0.3) * 0.5 + 0.5;
        const isActive = pulseValue > 0.6;
        const size = isActive ? 6 + pulseValue * 3 : 4;

        // Glow
        if (isActive) {
          const gradient = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, size * 3
          );
          gradient.addColorStop(0, `rgba(6, 182, 212, ${pulseValue * 0.8})`);
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node
        ctx.fillStyle = isActive
          ? `rgba(6, 182, 212, ${pulseValue})`
          : 'rgba(6, 182, 212, 0.6)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      pulsePhase += 0.02;
      activationWave += 0.01;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView]);

  const steps = [
    { icon: User, label: 'User Data', color: 'rgba(139, 92, 246, 0.8)' },
    { icon: Brain, label: 'AI Processing', color: 'rgba(6, 182, 212, 0.8)' },
    { icon: Zap, label: 'Personalization', color: 'rgba(236, 72, 153, 0.8)' },
    { icon: Mail, label: 'Perfect Email', color: 'rgba(16, 185, 129, 0.8)' },
  ];

  return (
    <section ref={sectionRef} className="py-24 px-4 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <Brain className="w-4 h-4" />
            <span>AI Engine</span>
          </div>
          <h2 className="text-display mb-4 text-white">
            See The AI Brain In Action
          </h2>
          <p className="text-xl max-w-2xl mx-auto text-slate-400">
            Watch how our neural network processes data to create perfectly personalized emails
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Neural Network Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card
              className="relative overflow-hidden border-2 shadow-2xl"
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                borderColor: 'rgba(6, 182, 212, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full"
                style={{ height: '400px' }}
              />

              {/* Scanline effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.03) 2px, rgba(6, 182, 212, 0.03) 4px)'
                }}
              />
            </Card>
          </motion.div>

          {/* Process Steps */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  {/* Icon */}
                  <div
                    className="relative flex-shrink-0"
                  >
                    <div
                      className="absolute inset-0 rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: step.color }}
                    />
                    <div
                      className="relative w-14 h-14 rounded-xl flex items-center justify-center border-2"
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        borderColor: step.color
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: step.color }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: step.color + '20',
                          color: step.color
                        }}
                      >
                        Step {index + 1}
                      </span>
                      <h3 className="text-xl text-white">{step.label}</h3>
                    </div>
                    <p className="text-slate-400">
                      {index === 0 && "Collects recipient data from website, CRM, and social signals"}
                      {index === 1 && "Neural network analyzes patterns and context to understand intent"}
                      {index === 2 && "AI generates unique content tailored to each recipient"}
                      {index === 3 && "Delivers a perfectly crafted, personalized message"}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: step.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-6 mt-16"
        >
          {[
            { value: '150M+', label: 'Data Points Analyzed' },
            { value: '<2s', label: 'Processing Time' },
            { value: '99.7%', label: 'Accuracy Rate' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div
                className="text-3xl md:text-4xl mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
              >
                {stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}