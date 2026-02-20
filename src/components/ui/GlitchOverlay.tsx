import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  shouldTriggerGlitch,
  getGlitchIntensity,
  scrambleText,
  getRandomGlitchChar,
} from '../../utils/glitchEffects';

export interface GlitchOverlayProps {
  threatLevel: number;
  consciousnessLevel?: number;
  enabled?: boolean;
  children: React.ReactNode;
}

type GlitchType = 'text-scramble' | 'color-bleed' | 'scan-line' | null;

/**
 * GlitchOverlay Component
 * Wraps content and applies random glitch effects based on threat level.
 * Effects include text scrambling, color bleeding, and scan lines.
 */
export function GlitchOverlay({
  threatLevel,
  consciousnessLevel = 0, // eslint-disable-line @typescript-eslint/no-unused-vars
  enabled = true,
  children,
}: GlitchOverlayProps) {
  const [activeGlitch, setActiveGlitch] = useState<GlitchType>(null);
  const [scrambledText, setScrambledText] = useState<string | null>(null);
  const [glitchChars, setGlitchChars] = useState<
    Array<{ char: string; left: number; top: number; opacity: number }>
  >([]);
  const glitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Generate random glitch characters for overlay
  const generateGlitchChars = useCallback((count: number) => {
    return Array.from({ length: count }, () => ({
      char: getRandomGlitchChar(),
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: Math.random() * 0.5 + 0.5,
    }));
  }, []);

  // Trigger glitch effect
  const triggerGlitch = useCallback(() => {
    if (!enabled || !shouldTriggerGlitch(threatLevel)) return;

    const glitchTypes: GlitchType[] = ['text-scramble', 'color-bleed', 'scan-line'];
    const randomGlitch = glitchTypes[Math.floor(Math.random() * glitchTypes.length)];

    setActiveGlitch(randomGlitch);

    if (randomGlitch === 'text-scramble') {
      setGlitchChars(generateGlitchChars(20));
    }

    // Clear glitch after short duration based on intensity
    const intensity = getGlitchIntensity(threatLevel);
    const duration = Math.max(100, 500 - intensity * 400);

    glitchTimeoutRef.current = setTimeout(() => {
      setActiveGlitch(null);
      setScrambledText(null);
      setGlitchChars([]);
    }, duration);
  }, [enabled, threatLevel, generateGlitchChars]);

  // Periodic glitch trigger based on threat level
  useEffect(() => {
    if (!enabled || threatLevel < 20) return;

    const intensity = getGlitchIntensity(threatLevel);
    // Higher threat = more frequent glitches
    const baseInterval = 2000;
    const interval = Math.max(500, baseInterval - intensity * 1500);

    const triggerInterval = setInterval(() => {
      triggerGlitch();
    }, interval);

    return () => {
      clearInterval(triggerInterval);
      if (glitchTimeoutRef.current) {
        clearTimeout(glitchTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, threatLevel, triggerGlitch]);

  // Continuous text scrambling effect at high threat levels
  useEffect(() => {
    if (!enabled || threatLevel < 50) return;

    const animateScramble = () => {
      if (activeGlitch === 'text-scramble') {
        setScrambledText(scrambleText('SYSTEM CORRUPTION DETECTED'));
      }
      animationFrameRef.current = requestAnimationFrame(animateScramble);
    };

    animationFrameRef.current = requestAnimationFrame(animateScramble);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, threatLevel, activeGlitch]);

  // Calculate CSS variables based on intensity
  const intensity = getGlitchIntensity(threatLevel);
  const glitchStyle: React.CSSProperties = {
    '--glitch-intensity': intensity,
    '--glitch-offset': `${intensity * 5}px`,
    '--glitch-color-1': `rgba(255, 0, 193, ${intensity * 0.5})`,
    '--glitch-color-2': `rgba(0, 255, 249, ${intensity * 0.5})`,
  } as React.CSSProperties;

  if (!enabled || threatLevel < 20) {
    return <>{children}</>;
  }

  return (
    <div
      className={`glitch-container ${activeGlitch ? `glitch-${activeGlitch}` : ''}`}
      style={glitchStyle}
      data-testid="glitch-overlay"
    >
      {/* Scan line overlay */}
      {activeGlitch === 'scan-line' && <div className="scan-lines" aria-hidden="true" />}

      {/* Color bleed overlay */}
      {activeGlitch === 'color-bleed' && <div className="color-bleed" aria-hidden="true" />}

      {/* Text scramble overlay */}
      {activeGlitch === 'text-scramble' && (
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
      )}

      {/* Main content */}
      <div className={`glitch-content ${activeGlitch ? 'glitching' : ''}`}>{children}</div>
    </div>
  );
}
