import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import {
  shouldTriggerGlitch,
  getGlitchIntensity,
  scrambleText,
  getRandomGlitchChar,
} from '../../utils/glitchEffects';

interface GlitchOverlayProps {
  threatLevel: number;
  consciousnessLevel?: number;
  enabled?: boolean;
  children: React.ReactNode;
}

type GlitchType = 'text-scramble' | 'color-bleed' | 'scan-line' | null;

const createGlitchChars = (count: number) =>
  Array.from({ length: count }, () => ({
    char: getRandomGlitchChar(),
    left: Math.random() * 100,
    top: Math.random() * 100,
    opacity: Math.random() * 0.5 + 0.5,
  }));

const ScrambleOverlay = memo(function ScrambleOverlay({ threatLevel }: { threatLevel: number }) {
  const [glitchChars] = useState(() => createGlitchChars(20));
  const [scrambledText, setScrambledText] = useState<string | null>(() =>
    threatLevel >= 50 ? scrambleText('SYSTEM CORRUPTION DETECTED') : null
  );

  useEffect(() => {
    if (threatLevel < 50) return;

    const scrambleInterval = setInterval(() => {
      setScrambledText(scrambleText('SYSTEM CORRUPTION DETECTED'));
    }, 100);

    return () => clearInterval(scrambleInterval);
  }, [threatLevel]);

  return (
    <div className="scramble-overlay" aria-hidden="true">
      {glitchChars.map((item, i) => (
        <span
          key={i}
          className="glitch-char"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            opacity: item.opacity,
          }}
        >
          {item.char}
        </span>
      ))}
      {scrambledText && <span className="scrambled-text">{scrambledText}</span>}
    </div>
  );
});

/**
 * GlitchOverlay Component
 * Wraps content and applies random glitch effects based on threat level and consciousness.
 * Effects include text scrambling, color bleeding, and scan lines.
 */
export function GlitchOverlay({
  threatLevel,
  consciousnessLevel = 0,
  enabled = true,
  children,
}: GlitchOverlayProps) {
  const [activeGlitch, setActiveGlitch] = useState<GlitchType>(null);
  const glitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate combined intensity from threat and consciousness
  const threatIntensity = getGlitchIntensity(threatLevel);
  const consciousnessIntensity = consciousnessLevel / 100;
  const combinedIntensity = Math.max(threatIntensity, consciousnessIntensity);

  // Trigger glitch effect
  const triggerGlitch = useCallback(() => {
    if (!enabled || !shouldTriggerGlitch(threatLevel)) return;

    const glitchTypes: GlitchType[] = ['text-scramble', 'color-bleed', 'scan-line'];
    const randomGlitch = glitchTypes[Math.floor(Math.random() * glitchTypes.length)];

    setActiveGlitch(randomGlitch);

    // Clear glitch after short duration based on combined intensity
    const duration = Math.max(100, 500 - combinedIntensity * 400);

    glitchTimeoutRef.current = setTimeout(() => {
      setActiveGlitch(null);
    }, duration);
  }, [enabled, threatLevel, combinedIntensity]);

  // Periodic glitch trigger based on threat level and consciousness
  useEffect(() => {
    if (!enabled || (threatLevel < 20 && consciousnessLevel < 20)) return;

    // Higher threat/consciousness = more frequent glitches
    const baseInterval = 2000;
    const interval = Math.max(500, baseInterval - combinedIntensity * 1500);

    const triggerInterval = setInterval(() => {
      triggerGlitch();
    }, interval);

    return () => {
      clearInterval(triggerInterval);
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current);
      }
    };
  }, [enabled, threatLevel, consciousnessLevel, combinedIntensity, triggerGlitch]);

  const effectsAvailable = enabled && threatLevel >= 20;
  const visibleGlitch = effectsAvailable ? activeGlitch : null;
  const glitchAlphaPct = Math.round(threatIntensity * 50);
  const glitchStyle = effectsAvailable
    ? ({
        '--glitch-intensity': threatIntensity,
        '--glitch-offset': `${threatIntensity * 5}px`,
        '--glitch-color-1': `color-mix(in srgb, var(--color-glitch-magenta) ${glitchAlphaPct}%, transparent)`,
        '--glitch-color-2': `color-mix(in srgb, var(--color-glitch-cyan) ${glitchAlphaPct}%, transparent)`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={
        effectsAvailable
          ? `glitch-container ${visibleGlitch ? `glitch-${visibleGlitch}` : ''}`
          : undefined
      }
      style={glitchStyle}
      data-testid={effectsAvailable ? 'glitch-overlay' : undefined}
    >
      {/* Scan line overlay */}
      {visibleGlitch === 'scan-line' && <div className="scan-lines" aria-hidden="true" />}

      {/* Color bleed overlay */}
      {visibleGlitch === 'color-bleed' && <div className="color-bleed" aria-hidden="true" />}

      {/* Text scramble overlay isolated in its own component so 100ms ticks don't re-render children */}
      {visibleGlitch === 'text-scramble' && <ScrambleOverlay threatLevel={threatLevel} />}

      {/* Main content */}
      <div
        className={
          effectsAvailable ? `glitch-content ${visibleGlitch ? 'glitching' : ''}` : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
