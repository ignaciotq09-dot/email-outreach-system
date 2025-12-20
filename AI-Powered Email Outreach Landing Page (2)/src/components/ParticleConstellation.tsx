'use client';

import { useEffect, useRef, useState } from 'react';
import { useScroll } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  opacity: number;
  targetOpacity: number;
  color: { r: number; g: number; b: number };
  angle: number;
  angleSpeed: number;
  orbitRadius: number;
  birthTime: number;
}

export function ParticleConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      
      // Initialize particles
      initParticles();
    };

    const initParticles = () => {
      const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 10000);
      particlesRef.current = [];
      
      for (let i = 0; i < particleCount; i++) {
        const isCyan = Math.random() > 0.5;
        particlesRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          baseSize: Math.random() * 1.5 + 1,
          size: 0,
          opacity: 0,
          targetOpacity: Math.random() * 0.5 + 0.3,
          color: isCyan 
            ? { r: 6, g: 182, b: 212 }
            : { r: 139, g: 92, b: 246 },
          angle: Math.random() * Math.PI * 2,
          angleSpeed: (Math.random() - 0.5) * 0.02,
          orbitRadius: Math.random() * 30 + 10,
          birthTime: Date.now() + (i * 20),
        });
      }
      
      console.log(`✨ Initialized ${particlesRef.current.length} particles`);
    };

    const drawParticle = (particle: Particle, currentTime: number) => {
      if (particle.opacity < 0.01) return;

      // Glow effect
      const glowSize = particle.size * 4;
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, glowSize
      );
      
      gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity})`);
      gradient.addColorStop(0.4, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity * 0.3})`);
      gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawConnection = (p1: Particle, p2: Particle) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 120;

      if (distance < maxDistance && p1.opacity > 0.1 && p2.opacity > 0.1) {
        const opacity = (1 - distance / maxDistance) * 0.3 * Math.min(p1.opacity, p2.opacity);
        
        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradient.addColorStop(0, `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(${(p1.color.r + p2.color.r) / 2}, ${(p1.color.g + p2.color.g) / 2}, ${(p1.color.b + p2.color.b) / 2}, ${opacity * 1.2})`);
        gradient.addColorStop(1, `rgba(${p2.color.r}, ${p2.color.g}, ${p2.color.b}, ${opacity})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    };

    const updateParticle = (particle: Particle, deltaTime: number, scroll: number, currentTime: number) => {
      const age = currentTime - particle.birthTime;
      
      // Smooth fade in
      if (age < 1500) {
        const progress = age / 1500;
        particle.opacity += (particle.targetOpacity * easeOutCubic(progress) - particle.opacity) * 0.1;
      } else {
        particle.opacity += (particle.targetOpacity - particle.opacity) * 0.05;
      }

      // Smooth pulsing size
      const pulseScale = 1 + Math.sin(currentTime * 0.001 + particle.angle) * 0.25;
      particle.size = particle.baseSize * pulseScale;

      // Orbital movement
      particle.angle += particle.angleSpeed;
      const orbitX = Math.cos(particle.angle) * particle.orbitRadius * 0.01;
      const orbitY = Math.sin(particle.angle) * particle.orbitRadius * 0.01;

      // Scroll influence
      const scrollInfluence = Math.max(0, scroll) * 0.0005;
      particle.vy += scrollInfluence * 0.1;

      // Update position with orbital movement
      particle.x += particle.vx + orbitX;
      particle.y += particle.vy + orbitY;

      // Smooth velocity dampening
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Wrap around screen
      const padding = 50;
      if (particle.x < -padding) particle.x = window.innerWidth + padding;
      if (particle.x > window.innerWidth + padding) particle.x = -padding;
      if (particle.y < -padding) particle.y = window.innerHeight + padding;
      if (particle.y > window.innerHeight + padding) particle.y = -padding;
    };

    // Easing function
    const easeOutCubic = (x: number): number => {
      return 1 - Math.pow(1 - x, 3);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    startTimeRef.current = Date.now();

    const animate = (currentTime: number) => {
      const scroll = scrollY.get();
      
      // Fade out when scrolled
      let canvasOpacity = 1;
      if (scroll > 800) {
        canvasOpacity = 0;
      } else if (scroll > 500) {
        canvasOpacity = 1 - (scroll - 500) / 300;
      }

      if (canvasOpacity > 0) {
        const deltaTime = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        // Clear with trail effect for smooth motion
        ctx.fillStyle = 'rgba(2, 6, 23, 0.12)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        const particles = particlesRef.current;

        // Update all particles
        particles.forEach(particle => {
          updateParticle(particle, deltaTime, scroll, currentTime);
        });

        // Draw connections
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            drawConnection(particles[i], particles[j]);
          }
        }

        // Draw particles
        particles.forEach(particle => {
          drawParticle(particle, currentTime);
        });
        ctx.globalCompositeOperation = 'source-over';

        // Apply fade
        if (canvas) {
          canvas.style.opacity = canvasOpacity.toString();
        }
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    console.log('🚀 Particle Constellation started');

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scrollY]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[5] transition-opacity duration-500"
      style={{
        mixBlendMode: 'screen',
      }}
    />
  );
}