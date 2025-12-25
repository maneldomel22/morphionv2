import { useEffect, useRef, useState } from 'react';

export default function AnimatedBackground({ children, enableGlow = false }) {
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const currentPosition = useRef({ x: 0.5, y: 0.5 });
  const animationFrameRef = useRef(null);
  const [particles, setParticles] = useState([]);

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
    const generateParticles = () => {
      const particleCount = 30;
      const newParticles = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.4 + 0.1,
        });
      }

      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  useEffect(() => {
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const animate = () => {
      currentPosition.current.x = lerp(
        currentPosition.current.x,
        mousePosition.x,
        0.02
      );
      currentPosition.current.y = lerp(
        currentPosition.current.y,
        mousePosition.y,
        0.02
      );

      const container = containerRef.current;
      if (container) {
        const xPercent = currentPosition.current.x * 100;
        const yPercent = currentPosition.current.y * 100;
        container.style.setProperty('--mouse-x', `${xPercent}%`);
        container.style.setProperty('--mouse-y', `${yPercent}%`);
      }

      setParticles(prevParticles =>
        prevParticles.map(particle => {
          let newX = particle.x + particle.speedX;
          let newY = particle.y + particle.speedY;

          if (newX < -5 || newX > 105) particle.speedX *= -1;
          if (newY < -5 || newY > 105) particle.speedY *= -1;

          newX = Math.max(-5, Math.min(105, newX));
          newY = Math.max(-5, Math.min(105, newY));

          return {
            ...particle,
            x: newX,
            y: newY,
          };
        })
      );

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

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white/30 backdrop-blur-sm"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.1s linear, top 0.1s linear',
            }}
          />
        ))}
      </div>

      {enableGlow && (
        <div className="absolute inset-0 interaction-glow pointer-events-none"></div>
      )}

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
