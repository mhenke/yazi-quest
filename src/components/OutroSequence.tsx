import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Terminal, Signal, UploadCloud, ArrowRight } from 'lucide-react';

import { CONCLUSION_DATA, CONCLUSION_PARTS } from '../constants';
import { playSuccessSound } from '../utils/sounds';
import { playTeaserMusic, stopTeaserMusic } from '../utils/teaserMusic';

export const OutroSequence: React.FC = () => {
  // Part navigation (like EpisodeIntro but across multiple parts)
  const [partIndex, setPartIndex] = useState(0);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [showContinue, setShowContinue] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTimer = useRef<number | null>(null);
  const typewriterRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  // Current part data
  const currentPart = CONCLUSION_PARTS[partIndex] || CONCLUSION_PARTS[0];

  // Split current part's lore into sections (separated by empty strings)
  const sections = useMemo(() => {
    const lore = currentPart?.lore || [];
    const result: string[][] = [];
    let current: string[] = [];

    for (const line of lore) {
      if (line === '') {
        if (current.length > 0) {
          result.push(current);
          current = [];
        }
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) {
      result.push(current);
    }

    return result;
  }, [currentPart]);

  // Current section lines
  const currentSection = sections[sectionIndex] || [];
  const currentText = currentSection.join('\n');

  // Check if we're at the final section of the final part
  const isFinalPart = partIndex === CONCLUSION_PARTS.length - 1;
  const isFinalSection = sectionIndex === sections.length - 1;
  const isComplete = isFinalPart && isFinalSection && showContinue;

  // Typewriter effect for current section
  useEffect(() => {
    if (showTeaser) return;

    setDisplayedText('');
    setShowContinue(false);
    isAnimatingRef.current = true;

    let charIndex = 0;
    const text = currentText;

    const animate = () => {
      if (charIndex < text.length) {
        charIndex++;
        setDisplayedText(text.slice(0, charIndex));
        typewriterRef.current = window.setTimeout(animate, 25);
      } else {
        isAnimatingRef.current = false;
        setShowContinue(true);
      }
    };

    typewriterRef.current = window.setTimeout(animate, 100);

    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, [partIndex, sectionIndex, currentText, showTeaser]);

  // Skip animation or advance to next section/part
  const handleAdvance = useCallback(() => {
    if (showTeaser) return;

    // If animating, skip to end
    if (isAnimatingRef.current) {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
      setDisplayedText(currentText);
      isAnimatingRef.current = false;
      setShowContinue(true);
      return;
    }

    // If at final section of current part, go to next part
    if (sectionIndex >= sections.length - 1) {
      if (partIndex < CONCLUSION_PARTS.length - 1) {
        setPartIndex((prev) => prev + 1);
        setSectionIndex(0);
      }
      // If at final part, do nothing (button handles teaser)
    } else {
      // Advance to next section
      setSectionIndex((prev) => prev + 1);
    }
  }, [showTeaser, currentText, sectionIndex, sections.length, partIndex]);

  // Keyboard handler for Enter/Space to advance
  useEffect(() => {
    if (showTeaser) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAdvance();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleAdvance, showTeaser]);

  // Play video only when teaser is shown and manage teaser music
  useEffect(() => {
    if (showTeaser && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        /* ignore video play failures in UX */
      });
      // start teaser music
      try {
        playTeaserMusic(true);
      } catch {
        /* ignore */
      }
    } else {
      // stop teaser music when teaser hidden
      try {
        stopTeaserMusic();
      } catch {
        /* ignore */
      }
    }

    return () => {
      try {
        stopTeaserMusic();
      } catch {
        /* ignore */
      }
    };
  }, [showTeaser]);

  // Delay rendering of the teaser overlay content slightly to avoid a flash
  useEffect(() => {
    if (showTeaser) {
      // hide overlay immediately, then show after short delay when video has begun fading in
      setShowOverlay(false);
      overlayTimer.current = window.setTimeout(() => setShowOverlay(true), 600);
    } else {
      // cleanup/hide
      setShowOverlay(false);
      if (overlayTimer.current) {
        clearTimeout(overlayTimer.current);
        overlayTimer.current = null;
      }
    }

    return () => {
      if (overlayTimer.current) {
        clearTimeout(overlayTimer.current);
        overlayTimer.current = null;
      }
    };
  }, [showTeaser]);

  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
      {/* Skip Outro Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => {
            if (showTeaser && videoRef.current) {
              // Replay the teaser if it's already showing
              try {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => {});
              } catch {
                // ignore
              }
              return;
            }
            playSuccessSound(true);
            setShowTeaser(true);
          }}
          className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border-2 border-zinc-700 hover:border-red-500 rounded backdrop-blur-sm shadow-lg"
        >
          <span>{showTeaser ? 'Replay Teaser' : 'Skip Outro'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
      {/* Narrative Section (Fades out when Teaser starts) */}
      <div
        className={`relative z-20 w-full max-w-3xl p-8 transition-opacity duration-1000 ${showTeaser ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {/* Part Header */}
        <div
          className="mb-8 border-l-4 pl-6 animate-in slide-in-from-left duration-1000"
          style={{
            borderColor:
              currentPart.color?.replace('text-', '').replace('-500', '') || 'rgb(239 68 68)',
          }}
        >
          <div className={`flex items-center gap-3 ${currentPart.color || 'text-red-500'} mb-2`}>
            <Terminal size={28} />
            <h1 className="text-2xl font-bold tracking-wider uppercase">{currentPart.title}</h1>
          </div>
          {currentPart.subtitle && (
            <p className="text-zinc-500 font-mono tracking-[0.3em] uppercase">
              {'//'} {currentPart.subtitle}
            </p>
          )}
        </div>

        {/* Typewriter Text for Current Section */}
        <div className="space-y-4 font-mono min-h-[200px]">
          {displayedText.split('\n').map((line, idx) => {
            const isBootLike = line.toUpperCase().includes('YOU HAVE DISAPPEARED');
            return (
              <p
                key={idx}
                className={`leading-relaxed ${isBootLike ? 'text-orange-400 font-mono uppercase tracking-wider text-lg md:text-xl' : 'text-zinc-300 text-lg md:text-xl'}`}
              >
                <span
                  className={`${isBootLike ? 'text-orange-400/70' : `${currentPart.color || 'text-red-500'}/50`} mr-2`}
                >
                  {'>'}
                </span>
                {line}
              </p>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 flex items-center justify-center gap-4">
          {/* Part dots */}
          <div className="flex gap-2">
            {CONCLUSION_PARTS.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < partIndex
                    ? 'bg-green-500'
                    : i === partIndex
                      ? `${currentPart.color?.replace('text-', 'bg-') || 'bg-red-500'} animate-pulse`
                      : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
          {/* Section dots within current part */}
          {sections.length > 1 && (
            <>
              <div className="w-px h-4 bg-zinc-600" />
              <div className="flex gap-1">
                {sections.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < sectionIndex
                        ? 'bg-zinc-400'
                        : i === sectionIndex
                          ? 'bg-white'
                          : 'bg-zinc-700'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Continue prompt or Final button */}
        {showContinue && !showTeaser && (
          <div className="mt-6 flex justify-center animate-in fade-in duration-500">
            {isComplete ? (
              <button
                onClick={() => {
                  playSuccessSound(true);
                  setShowTeaser(true);
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded text-white font-mono uppercase tracking-wider flex items-center gap-2"
              >
                <Signal size={18} />
                View Transmission
              </button>
            ) : (
              <p className="text-zinc-500 font-mono text-sm animate-pulse">
                Press Enter to continue...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Video Teaser Section */}
      <div className={`absolute inset-0 z-10 flex items-center justify-center`}>
        {/* Background Video Container - Fades in */}
        <div
          className={`absolute inset-0 transition-opacity duration-3000 delay-500 ${showTeaser ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        >
          <video
            ref={videoRef}
            src={CONCLUSION_DATA.videoUrl}
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
            muted
            playsInline
          />
          {/* Scanlines Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-20" />
        </div>

        {/* Teaser Overlay Content - Rendered ONLY when active to prevent flash */}
        {showTeaser && showOverlay && (
          <div className="relative z-30 flex flex-col items-center text-center space-y-4 md:space-y-8 p-12 bg-black/40 backdrop-blur-sm border-y border-red-500/30 w-full animate-in fade-in zoom-in-95 duration-1000 delay-1000 fill-mode-forwards">
            <div className="animate-pulse text-red-500 mb-2">
              <Signal size={48} />
            </div>

            <h2 className="text-xl md:text-2xl text-red-400 font-mono tracking-[0.3em] uppercase animate-in slide-in-from-bottom-4 duration-1000">
              {CONCLUSION_DATA.overlayTitle}
            </h2>

            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-in-center">
              {CONCLUSION_DATA.sequelTitle}
            </h2>

            <div className="h-px w-32 bg-red-500" />

            <h3 className="text-2xl text-red-400 tracking-[0.5em] uppercase font-light">
              {CONCLUSION_DATA.sequelSubtitle}
            </h3>

            <div className="pt-8 md:pt-12">
              <div className="flex items-center gap-2 text-zinc-400 text-sm font-mono border border-zinc-700 px-4 py-2 rounded bg-black/80">
                <UploadCloud size={16} className="animate-bounce" />
                <a
                  href="https://github.com/mhenke/yazi-quest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white"
                >
                  Establishing Remote Uplink...
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
