import React, { useEffect, useState } from 'react';
import {
  Binary,
  Code,
  Cpu,
  Database,
  FileDigit,
  Globe,
  Key,
  Network,
  Shield,
  Sparkles,
  Terminal,
  Unlock,
  Zap,
} from 'lucide-react';

interface Particle {
  id: number;
  x: number; // Start X (percentage)
  y: number; // Start Y (percentage)
  angle: number; // Direction in degrees
  velocity: number;
  rotation: number;
  color: string;
  Icon: React.ElementType;
  size: number;
  delay: number;
}

const COLORS = [
  'text-green-500',
  'text-emerald-400',
  'text-blue-500',
  'text-cyan-400',
  'text-purple-500',
  'text-fuchsia-400',
  'text-orange-500',
  'text-yellow-400',
];

const ICONS = [
  Binary,
  Code,
  Cpu,
  Database,
  FileDigit,
  Globe,
  Key,
  Network,
  Shield,
  Sparkles,
  Terminal,
  Unlock,
  Zap,
];

export const CelebrationConfetti: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>(() => {
    // Generate particles
    const particleCount = 50;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: 50, // Start from center
        y: 50,
        angle: Math.random() * 360,
        velocity: 15 + Math.random() * 35, // Distance to travel
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        Icon: ICONS[Math.floor(Math.random() * ICONS.length)],
        size: 16 + Math.random() * 24,
        delay: Math.random() * 0.2, // Stagger slightly
      });
    }

    return newParticles;
  });

  return (
    <div className="fixed inset-0 z-[85] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute opacity-0 animate-celebration-burst ${p.color}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            // @ts-expect-error - Custom CSS variables for animation
            '--angle': `${p.angle}deg`,
            '--velocity': `${p.velocity}vh`,
            '--rotation': `${p.rotation}deg`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <p.Icon size={p.size} strokeWidth={2.5} />
        </div>
      ))}
      <style>{`
        @keyframes celebration-burst {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0.5);
          }
          10% {
            opacity: 1;
            transform: translate(-50%, -50%) translate(calc(cos(var(--angle)) * var(--velocity) * 0.2), calc(sin(var(--angle)) * var(--velocity) * 0.2)) rotate(var(--rotation)) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(calc(cos(var(--angle)) * var(--velocity)), calc(sin(var(--angle)) * var(--velocity))) rotate(calc(var(--rotation) + 360deg)) scale(0);
          }
        }
        .animate-celebration-burst {
          animation: celebration-burst 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
};
