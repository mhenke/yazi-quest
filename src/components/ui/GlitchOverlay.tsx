import React, { useEffect, useState } from 'react';
import { shouldTriggerGlitch, getGlitchIntensity, scrambleText } from '../../utils/glitchEffects';

interface GlitchOverlayProps {
  threatLevel: number;
  consciousnessLevel?: number;
  enabled?: boolean;
  children: React.ReactNode;
}

export function GlitchOverlay({
  threatLevel,
  consciousnessLevel = 0,
  enabled = true,
  children,
}: GlitchOverlayProps) {
  const [activeGlitch, setActiveGlitch] = useState<string | null>(null);

  // Calculate intensity directly from props (no state needed)
  const intensity = enabled
    ? Math.max(getGlitchIntensity(threatLevel), consciousnessLevel / 100)
    : 0;

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(
      () => {
        if (shouldTriggerGlitch(threatLevel)) {
          const glitches = ['text-scramble', 'color-bleed', 'scan-line'];
          const glitch = glitches[Math.floor(Math.random() * glitches.length)];
          setActiveGlitch(glitch);

          setTimeout(() => setActiveGlitch(null), 200 + Math.random() * 300);
        }
      },
      2000 - intensity * 1500
    ); // Faster at higher intensity

    return () => clearInterval(interval);
  }, [threatLevel, intensity, enabled]);

  return (
    <div className={`glitch-container relative ${activeGlitch || ''}`}>
      {activeGlitch === 'text-scramble' && (
        <div className="scramble-overlay pointer-events-none">
          {scrambleText('SYSTEM INSTABILITY DETECTED')}
        </div>
      )}

      {activeGlitch === 'scan-line' && <div className="scan-lines pointer-events-none" />}

      <div className={intensity > 0.8 ? 'color-bleed' : ''}>{children}</div>
    </div>
  );
}
