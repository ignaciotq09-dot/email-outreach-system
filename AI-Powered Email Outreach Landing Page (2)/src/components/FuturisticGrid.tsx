import { useEffect, useRef } from 'react';

export function FuturisticGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const gridSize = 50;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Animated grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        
        // Distance from mouse
        const distance = Math.abs(mouseX - x);
        if (distance < 150) {
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 * (1 - distance / 150)})`;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        
        const distance = Math.abs(mouseY - y);
        if (distance < 150) {
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 * (1 - distance / 150)})`;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }

      // Glowing dots at intersections near mouse
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          const dx = mouseX - x;
          const dy = mouseY - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            const opacity = 1 - distance / 200;
            const size = 3 * opacity;
            
            // Glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
            gradient.addColorStop(0, `rgba(6, 182, 212, ${opacity * 0.8})`);
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size * 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Center dot
            ctx.fillStyle = `rgba(6, 182, 212, ${opacity})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Animated scan lines
      offset = (offset + 1) % canvas.height;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(canvas.width, offset);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, (offset + 50) % canvas.height);
      ctx.lineTo(canvas.width, (offset + 50) % canvas.height);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
}
