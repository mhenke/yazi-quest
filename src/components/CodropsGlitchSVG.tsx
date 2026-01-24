import React, { useEffect, useRef } from 'react';

/**
 * Renders an SVG filter definition for the Codrops Demo 1 style glitch effect.
 * Uses feDisplacementMap for "tearing" and feColorMatrix for chromatic aberration fallback.
 * The displacement is animated via the baseFrequency of feTurbulence.
 */
export const CodropsGlitchSVG: React.FC = () => {
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    // We want to sync loosely with the CSS animation (approx 4s cycle).
    // CSS: 10% active (0.4s), 90% static (3.6s).

    let frameId: number;
    let isActive = false;
    let cycleStartTime = performance.now();
    const CYCLE_DURATION = 4000;
    const ACTIVE_DURATION = 400; // 10% of 4000

    const animate = (time: number) => {
      const timeInCycle = (time - cycleStartTime) % CYCLE_DURATION;

      // Check if we are in the "active" glitch window
      if (timeInCycle < ACTIVE_DURATION) {
        isActive = true;
        if (turbulenceRef.current) {
          // Active glitch: set high frequencies and random seeds
          const freqY = 0.02 + Math.random() * 0.2;
          turbulenceRef.current.setAttribute('baseFrequency', `0.000001 ${freqY}`);
          turbulenceRef.current.setAttribute('seed', Math.floor(Math.random() * 100).toString());
        }
      } else {
        // Inactive window: Reset to 0 or very smooth state
        if (isActive) {
          isActive = false;
          if (turbulenceRef.current) {
            // Turn off distortion
            turbulenceRef.current.setAttribute('baseFrequency', '0 0');
          }
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
      <defs>
        <filter id="codrops-glitch" x="-20%" y="-20%" width="140%" height="140%">
          {/* 
            Generate noise for displacement. 
            baseFrequency X is tiny to make noise stretch horizontally (stripes).
            baseFrequency Y controls how thin the stripes are.
          */}
          <feTurbulence
            ref={turbulenceRef}
            type="fractalNoise"
            baseFrequency="0.000001 0.1"
            numOctaves="1"
            result="warp"
          />

          {/* Displacement Map: "Slices" the source image based on the noise */}
          <feDisplacementMap
            xChannelSelector="R"
            yChannelSelector="G"
            scale="40"
            in="SourceGraphic"
            in2="warp"
            result="displaced"
          />

          {/* 
             Ideally we would split RGB here, but standard SVG 1.1 doesn't let us easily offset channels *independently* 
             without complex merge chains.
             For a simple robust effect, we'll rely on the displacement for the "glitch shape"
             and CSS for any additional color overlays, OR use a simple color matrix to tint it if needed.
             
             Let's add a slight RGB split simulation using feOffset and Composite relative to Source?
             That's expensive. Let's stick to displacement + CSS shake for now.
           */}
        </filter>
      </defs>
    </svg>
  );
};
