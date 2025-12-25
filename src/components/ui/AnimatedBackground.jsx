import { useEffect, useRef, useState } from 'react';

export default function AnimatedBackground({ children, enableGlow = false }) {
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const currentPosition = useRef({ x: 0.5, y: 0.5 });
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition({ x, y });
    };

    const handleMouseLeave = () => {
      setMousePosition({ x: 0.5, y: 0.5 });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const animate = () => {
      currentPosition.current.x = lerp(
        currentPosition.current.x,
        mousePosition.x,
        0.05
      );
      currentPosition.current.y = lerp(
        currentPosition.current.y,
        mousePosition.y,
        0.05
      );

      const container = containerRef.current;
      if (container) {
        const xPercent = currentPosition.current.x * 100;
        const yPercent = currentPosition.current.y * 100;
        container.style.setProperty('--mouse-x', `${xPercent}%`);
        container.style.setProperty('--mouse-y', `${yPercent}%`);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%',
      }}
    >
      <div className="absolute inset-0 bg-animated-gradient">
        <div className="absolute inset-0 noise-overlay"></div>
      </div>

      <div className="absolute inset-0 radial-glow"></div>

      {enableGlow && (
        <div className="absolute inset-0 interaction-glow pointer-events-none"></div>
      )}

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
