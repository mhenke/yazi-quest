import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Terminal, Signal, UploadCloud, ArrowRight, Zap, Shield, Crown } from 'lucide-react';

import {
  CONCLUSION_DATA,
  CONCLUSION_PARTS,
  EPISODE_LORE,
  CREDITS_DATA,
} from '../constants/narrative';
import { paletteFor } from '../constants/palette';
import { playSuccessSound } from '../utils/sounds';
import { playTeaserMusic, stopTeaserMusic } from '../utils/teaserMusic';
import { useGlobalInput } from '../GlobalInputContext';
import { Scanlines } from './narrative/Scanlines';

interface OutroSequenceProps {
  onRestartCycle?: () => void;
  reduceMotion?: boolean;
  showFocusRing?: boolean;
}

interface TeaserOverlayProps {
  onRestartCycle?: () => void;
}

const TeaserOverlay: React.FC<TeaserOverlayProps> = ({ onRestartCycle }) => (
  <div className="relative z-30 h-full w-full overflow-y-auto flex items-start sm:items-center justify-center">
    <div className="my-auto flex flex-col items-center text-center space-y-4 md:space-y-8 p-6 sm:p-10 md:p-12 bg-black/40 backdrop-blur-xs border-y border-red-500/30 w-full animate-terminal-pop animate-terminal-delay-1s">
      <div className="animate-pulse text-red-500 mb-2">
        <Signal size={48} />
      </div>

      <h2 className="text-xl md:text-2xl text-red-400 font-mono tracking-[0.3em] uppercase animate-terminal-rise">
        {CONCLUSION_DATA.overlayTitle}
      </h2>

      <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white tracking-tighter uppercase">
        {CONCLUSION_DATA.sequelTitle}
      </h2>

      <div className="h-px w-32 bg-red-500" />

      <h3 className="text-xl sm:text-2xl text-red-400 tracking-[0.5em] uppercase font-light">
        {CONCLUSION_DATA.sequelSubtitle}
      </h3>

      {/* Persistent Rewards / System Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
        {EPISODE_LORE.map((ep, idx) => {
          const episodeIcons = [Zap, Shield, Crown];
          const Icon = episodeIcons[idx] || Shield;
          const palette = paletteFor(ep.color);
          return (
            <div key={ep.id} className="flex flex-col items-center gap-2">
              <div
                className={`p-3 rounded-full bg-zinc-900 ring-2 ring-offset-2 ring-offset-black ${palette.ring}`}
              >
                <Icon size={24} className={palette.text} />
              </div>
              <span className={`text-xs font-mono uppercase tracking-widest ${palette.text}`}>
                {ep.name}
              </span>
              <span className="text-xs text-zinc-400 uppercase">System Installed</span>
            </div>
          );
        })}
      </div>

      <div className="pt-8 md:pt-12">
        <div className="flex items-center gap-2 text-zinc-400 text-sm font-mono border border-zinc-700 px-4 py-2 rounded bg-black/80">
          <UploadCloud size={16} className="animate-pulse" aria-hidden="true" />
          <a
            href="https://github.com/mhenke/yazi-quest"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center min-h-6 py-0.5 underline hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Establishing Remote Uplink...
          </a>
        </div>
      </div>

      {/* ROLLING CREDITS SECTION */}
      <div className="pt-12 w-full max-w-md overflow-hidden h-40 relative outro-credits-viewport">
        <div className="animate-scroll-y flex flex-col gap-8 py-4">
          {CREDITS_DATA.map((credit, i) => (
            <div key={i} className="flex flex-col gap-1 items-center">
              <span className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
                {credit.role}
              </span>
              <span className="text-lg text-white font-bold tracking-tight">{credit.name}</span>
            </div>
          ))}
        </div>
        {/* Fade masks */}
        <div className="absolute inset-x-0 top-0 h-12 bg-linear-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Manual Restart Button (Pillar I) */}
      <div className="pt-6 md:pt-8 animate-terminal-rise animate-terminal-delay-5s">
        <button
          type="button"
          onClick={onRestartCycle}
          className="group relative px-8 py-4 bg-transparent border-2 border-red-500/50 hover:border-red-500 rounded text-red-400 hover:text-white transition-all duration-300 overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10" />
          <div className="flex items-center gap-3 font-mono font-bold tracking-[0.2em] uppercase">
            <Zap size={20} className="animate-pulse" aria-hidden="true" />
            <span>Initialize New Cycle</span>
            <ArrowRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </div>
        </button>
        <p className="mt-4 text-xs text-zinc-400 font-mono uppercase tracking-widest animate-pulse">
          Establishing consciousness bridge...
        </p>
      </div>
    </div>
  </div>
);

interface OutroVideoSectionProps {
  showTeaser: boolean;
  showOverlay: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onRestartCycle?: () => void;
}

const OutroVideoSection: React.FC<OutroVideoSectionProps> = ({
  showTeaser,
  showOverlay,
  videoRef,
  onRestartCycle,
}) => (
  <div className="absolute inset-0 z-10 overflow-hidden">
    <div
      className={`absolute inset-0 pointer-events-none transition-opacity duration-500 delay-500 ${showTeaser ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
    >
      <video
        ref={videoRef}
        src={showTeaser ? CONCLUSION_DATA.videoUrl : undefined}
        preload="none"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
        muted
        playsInline
      />
      <Scanlines className="z-20" />
    </div>

    {showTeaser && showOverlay && <TeaserOverlay onRestartCycle={onRestartCycle} />}
  </div>
);

const useOutroTypewriter = (
  sectionKey: string,
  currentText: string,
  showTeaser: boolean,
  reduceMotion?: boolean
) => {
  const [typingState, setTypingState] = useState({ key: sectionKey, text: '', done: false });
  const typewriterRef = useRef<number | null>(null);

  const isCurrent = typingState.key === sectionKey;
  const displayedText = reduceMotion ? currentText : isCurrent ? typingState.text : '';
  const showContinue = Boolean(reduceMotion) || (isCurrent && typingState.done);
  const isAnimating = !reduceMotion && !showTeaser && !showContinue;

  useEffect(() => {
    if (showTeaser || reduceMotion) return;

    let charIndex = 0;
    const animate = () => {
      if (charIndex < currentText.length) {
        charIndex++;
        setTypingState({ key: sectionKey, text: currentText.slice(0, charIndex), done: false });
        typewriterRef.current = window.setTimeout(animate, 25);
      } else {
        setTypingState({ key: sectionKey, text: currentText, done: true });
      }
    };

    typewriterRef.current = window.setTimeout(animate, 100);
    return () => {
      if (typewriterRef.current) clearTimeout(typewriterRef.current);
    };
  }, [sectionKey, currentText, showTeaser, reduceMotion]);

  const skipTyping = useCallback(() => {
    if (typewriterRef.current) clearTimeout(typewriterRef.current);
    setTypingState({ key: sectionKey, text: currentText, done: true });
  }, [sectionKey, currentText]);

  return { displayedText, showContinue, isAnimating, skipTyping };
};

const outroPanelFocusClass = (showFocusRing = false): string =>
  showFocusRing
    ? 'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-400'
    : 'focus-visible:outline-hidden';

export const OutroSequence: React.FC<OutroSequenceProps> = ({
  onRestartCycle,
  reduceMotion,
  showFocusRing,
}) => {
  // Part navigation (like EpisodeIntro but across multiple parts)
  const [partIndex, setPartIndex] = useState(0);
  const [sectionIndex, setSectionIndex] = useState(0);
  const sectionKey = `${partIndex}:${sectionIndex}`;
  const [showTeaser, setShowTeaser] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [overlayReady, setOverlayReady] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Current part data

  const currentPart = CONCLUSION_PARTS[partIndex] || CONCLUSION_PARTS[0];
  const partPalette = paletteFor(currentPart?.color ?? 'text-red-500');

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

  const { displayedText, showContinue, isAnimating, skipTyping } = useOutroTypewriter(
    sectionKey,
    currentText,
    showTeaser,
    reduceMotion
  );
  const showOverlay = showTeaser && (Boolean(reduceMotion) || overlayReady);

  // Check if we're at the final section of the final part
  const isFinalPart = partIndex === CONCLUSION_PARTS.length - 1;
  const isFinalSection = sectionIndex === sections.length - 1;
  const isComplete = isFinalPart && isFinalSection && showContinue;

  // Skip animation or advance to next section/part
  const handleAdvance = useCallback(() => {
    if (showTeaser) return;

    // If we've reached the final section of the final part and continue is visible,
    // treat advance as the 'View Transmission' action.
    if (isComplete) {
      playSuccessSound(true);
      setShowTeaser(true);
      return;
    }

    // If animating, skip to end
    if (isAnimating) {
      skipTyping();
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
  }, [showTeaser, isAnimating, skipTyping, sectionIndex, sections.length, partIndex, isComplete]);

  // Enter skips typing; Shift+Enter advances.
  useGlobalInput(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // Shift+Enter advances
        if (e.shiftKey) {
          handleAdvance();
          return true;
        }

        // Enter without shift only skips typing if animation is running
        if (isAnimating) {
          skipTyping();
        }
        return true;
      }
    },
    [handleAdvance, isAnimating, skipTyping],
    { priority: 900, enabled: !showTeaser }
  );

  // Play video only when teaser is shown and manage teaser music
  useEffect(() => {
    if (showTeaser && videoRef.current) {
      videoRef.current.currentTime = 0;
      if (reduceMotion) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          /* ignore video play failures in UX */
        });
      }
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
  }, [showTeaser, reduceMotion]);

  const renderHighlighted = (text: string) => {
    // Only match the specific AI identifiers we use
    const regex = /(AI-7734|AI-7733|AI-7735)/g;
    if (!regex.test(text)) return text;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    text.replace(regex, (match, p1, offset) => {
      const before = text.slice(lastIndex, offset as number);
      if (before) parts.push(before);
      const cls =
        match === 'AI-7734'
          ? 'text-orange-400 font-bold'
          : match === 'AI-7733'
            ? 'text-blue-400 font-bold'
            : 'text-yellow-400 font-bold';
      parts.push(
        <span key={offset} className={cls}>
          {match}
        </span>
      );
      lastIndex = (offset as number) + match.length;
      return match;
    });
    const rest = text.slice(lastIndex);
    if (rest) parts.push(rest);
    return parts;
  };

  // Delay rendering of the teaser overlay content slightly to avoid a flash
  useEffect(() => {
    if (!showTeaser || reduceMotion) return;

    const timer = window.setTimeout(() => setOverlayReady(true), 600);
    return () => clearTimeout(timer);
  }, [showTeaser, reduceMotion]);

  // The page cannot scroll (body is overflow:hidden), so the log owns the scroll.
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  // Pillar I: Automatic restart timer removed to prevent unintentional triggers while user is away
  // We will now use a manual button instead

  return (
    <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center p-4 sm:p-8 overflow-hidden animate-terminal-fade">
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
          className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border-2 border-zinc-700 hover:border-red-500 rounded backdrop-blur-xs shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <span>
            {showTeaser ? (reduceMotion ? 'Play Teaser' : 'Replay Teaser') : 'Skip Outro'}
          </span>
          <ArrowRight size={14} />
        </button>
      </div>
      {/* Narrative Section (Fades out when Teaser starts) */}
      <div
        className={`relative z-20 w-full max-w-3xl max-h-full flex flex-col p-4 pt-16 sm:p-8 transition-opacity duration-1000 ${showTeaser ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        inert={showTeaser}
      >
        <div
          ref={panelRef}
          role="region"
          aria-label="Conclusion"
          tabIndex={0}
          className={`min-h-0 overflow-y-auto px-3 py-2 ${outroPanelFocusClass(showFocusRing)}`}
        >
          {/* Part Header */}
          <div
            className="mb-8 border-l-4 pl-6 animate-terminal-slide-left"
            style={{ borderColor: partPalette.hex }}
          >
            <div className={`flex items-center gap-3 ${partPalette.text} mb-2`}>
              <Terminal size={28} />
              <h1 className="text-2xl font-bold tracking-wider uppercase">{currentPart.title}</h1>
            </div>
            {currentPart.subtitle && (
              <p className="text-zinc-400 font-mono tracking-[0.3em] uppercase">
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
                    aria-hidden="true"
                    className={`${isBootLike ? 'text-orange-400/70' : partPalette.soft} mr-2`}
                  >
                    {'>'}
                  </span>
                  {renderHighlighted(line)}
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
                        ? `${partPalette.bgSolid} ring-2 ring-offset-2 ring-offset-black ${partPalette.ring}`
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
        </div>

        {/* Continue prompt or Final button */}
        {showContinue && !showTeaser && (
          <div className="shrink-0 pt-4 flex justify-center animate-terminal-fade">
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
              <p className="text-zinc-300 font-mono text-sm">Press Shift+Enter to continue...</p>
            )}
          </div>
        )}
      </div>

      {/* Video Teaser Section */}
      <OutroVideoSection
        showTeaser={showTeaser}
        showOverlay={showOverlay}
        videoRef={videoRef}
        onRestartCycle={onRestartCycle}
      />
    </div>
  );
};
