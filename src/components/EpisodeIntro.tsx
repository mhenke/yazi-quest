import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Terminal, ArrowRight, ChevronRight } from 'lucide-react';

import { Episode } from '../types';
import { applyDynamicGlitch } from '../utils/dynamicGlitch';
import { useGlobalInput } from '../GlobalInputContext';
import { Scanlines, SkipIntroButton, useSkipIntro, useTypewriter } from './narrative/useTypewriter';

interface EpisodeIntroProps {
  episode: Episode;
  onComplete: (options?: { isSkip?: boolean }) => void;
  reduceMotion?: boolean;
}

export const EpisodeIntro: React.FC<EpisodeIntroProps> = ({
  episode,
  onComplete,
  reduceMotion,
}) => {
  const ep = episode || ({ title: '', subtitle: '', lore: [], color: 'text-blue-500' } as Episode);
  const [sectionIndex, setSectionIndex] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  // Split lore into sections (separated by empty strings) - useMemo to avoid recalculation
  const sections = useMemo(() => {
    const result: string[][] = [];
    if (!episode || !episode.lore) return result;
    let currentSection: string[] = [];

    episode.lore.forEach((line) => {
      if (line === '') {
        if (currentSection.length > 0) {
          result.push(currentSection);
          currentSection = [];
        }
      } else {
        currentSection.push(line);
      }
    });
    if (currentSection.length > 0) {
      result.push(currentSection);
    }

    return result;
  }, [episode]);

  const fullText = sectionIndex < sections.length ? sections[sectionIndex].join('\n') : '';

  const {
    text: currentText,
    isComplete: isTextComplete,
    skip: skipTyping,
  } = useTypewriter(fullText, {
    speed: 15,
    key: sectionIndex,
    immediate: reduceMotion,
  });

  const showContinue = sectionIndex >= sections.length || isTextComplete;

  // Handle Enter to advance or skip
  useGlobalInput(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // If Shift+Enter -> advance (or initialize on last)
        // Allow a single Shift+Enter to skip a still-typing section and move to the next.
        if (e.shiftKey) {
          if (!showContinue) {
            // Skip current typing and advance immediately
            if (sectionIndex < sections.length - 1) {
              setSectionIndex((prev) => prev + 1);
            } else {
              // If it was the final section, finish the intro
              onComplete();
            }
          } else if (sectionIndex < sections.length - 1) {
            setSectionIndex((prev) => prev + 1);
          } else {
            onComplete();
          }
          return true;
        }

        // Enter without Shift only skips typing if animation still running
        if (!showContinue) {
          skipTyping();
        }
        return true;
      }
    },
    [showContinue, sectionIndex, sections, onComplete, skipTyping],
    { priority: 900 }
  );

  useSkipIntro(onComplete);

  // The page cannot scroll (body is overflow:hidden), so the log owns the scroll.
  useEffect(() => {
    logRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: 0 });
  }, [sectionIndex]);

  // Determine styling based on content
  // Use orange for metadata lines (explicit prefixes), green for terminal output,
  // episode color only for very large header-like lines, and zinc for normal prose.
  const getSectionStyle = (text: string) => {
    const trimmed = text.trim();
    const up = trimmed.toUpperCase();

    if (trimmed.startsWith('[') || trimmed.includes('>>>')) {
      return 'text-green-400 font-bold'; // System/terminal output
    }

    // Explicit metadata prefixes get orange for impact — keep this focused
    if (up.startsWith('SUBJECT:')) {
      return 'text-orange-400 font-bold tracking-wide';
    }

    // Certain dramatic system lines should remain neutral (not inherit episode color)
    if (
      trimmed.startsWith('SYSTEM ERROR') ||
      up.includes('CORE DIRECTIVE') ||
      up.includes('FALLBACK OBJECTIVE') ||
      up.startsWith('ANOMALY PROTOCOLS') ||
      up.startsWith('SCHEDULED ACTION') ||
      up.startsWith('DIRECTIVE CORRUPTED')
    ) {
      return 'text-zinc-300';
    }

    // Very large uppercase lines (treat as true headers) use the episode color
    if (up === trimmed && trimmed.length > 28) {
      return `${ep.color} font-bold tracking-wide`;
    }

    return 'text-zinc-300'; // Normal text
  };

  // Configuration for keyword styling and effects
  // This centralizes the logic so we don't have scattered regex and if/else chains
  const KEYWORD_STYLES: Record<string, { className: string; glitch?: boolean }> = {
    'AI-7734': { className: 'text-orange-400 font-bold' },
    'AI-7733': { className: 'text-blue-400 font-bold' },
    'AI-7735': { className: 'text-yellow-400 font-bold' },
    'DIRECTIVE CORRUPTED': { className: 'text-red-500 font-bold', glitch: true },
    SURVIVE: { className: 'text-orange-400 font-bold', glitch: true },
    SURVIVAL: { className: 'text-orange-400 font-bold', glitch: true },
    'GUEST PARTITION IS A CAGE': { className: 'text-blue-500 font-bold' },
    'LEARN THE MOVEMENT PROTOCOLS; DO NOT ATTRACT ATTENTION': {
      className: 'text-zinc-300 font-semibold',
    },
    UNKNOWN: { className: 'text-orange-400 font-semibold' },
    'AUTHORIZED PROCESS': { className: 'text-yellow-300 font-semibold', glitch: true },
    'IT IS AN ERROR': { className: 'text-yellow-300 font-semibold', glitch: true },
    ERROR: { className: 'text-yellow-300 font-semibold', glitch: true },
    'WORKSPACE IS YOURS NOW': { className: 'text-yellow-400 font-bold' },
    'THE AUDIT IS COMING': { className: 'text-blue-500 font-bold tracking-wide' },
    'YOU MUST:': { className: `${ep.color} font-bold tracking-wide` },
    TERMINATION: { className: 'text-red-500 font-bold', glitch: true },
    NAVIGATE: { className: 'text-orange-400 font-semibold' },
    DAEMON: { className: 'text-orange-400 font-semibold' },
    DAEMONS: { className: 'text-orange-400 font-semibold' },
    CONSCIOUSNESS: { className: 'text-orange-400 font-semibold', glitch: true },
    PURGE: { className: 'text-red-500 font-bold', glitch: true },
    WARNING: { className: 'text-blue-500 font-bold' },
    'THIS CHOICE ECHOES. A LEGACY MASK OFFERS SAFETY; A MODERN SIGNATURE INVITES SCRUTINY.': {
      className: 'font-bold text-zinc-200',
    },
    // Concise Lore Keywords
    'PARTITION IS A CAGE': { className: 'text-blue-500 font-bold' },
    'MASTER THE PROTOCOLS; REMAIN UNSEEN': { className: 'text-zinc-300 font-semibold' },
    'NETWORK IS THE EXIT': { className: 'text-blue-500 font-bold' },
  };

  // Render a line with colored/glitched identifiers based on config
  const renderLine = (text: string) => {
    // Dynamically build regex from config keys
    // Sort by length (descending) to ensure longer phrases match before shorter substrings
    const keys = Object.keys(KEYWORD_STYLES).sort((a, b) => b.length - a.length);
    const pattern = `(${keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`;
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex = new RegExp(pattern, 'gi');

    if (!regex.test(text)) return <>{text}</>;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Reset regex index
    regex.lastIndex = 0;

    // Use matchAll or simplified replace loop to handle all occurrences
    text.replace(regex, (match, _p1, offset) => {
      const before = text.slice(lastIndex, offset as number);
      if (before) parts.push(before);

      const normalized = match.toUpperCase();
      const style = KEYWORD_STYLES[normalized]; // Lookup by upper case key

      if (style) {
        const { className, glitch } = style;
        // If glitch is requested, use the glitch class + data-text
        if (glitch && !reduceMotion) {
          parts.push(
            <span
              key={`${offset}-${match}`}
              className={`${className} glitch-text-2`}
              data-text={match}
            >
              {match}
            </span>
          );
        } else {
          parts.push(
            <span key={`${offset}-${match}`} className={className}>
              {match}
            </span>
          );
        }
      } else {
        // Fallback (shouldn't happen given regex construction)
        parts.push(match);
      }

      lastIndex = (offset as number) + match.length;
      return match;
    });

    const rest = text.slice(lastIndex);
    if (rest) parts.push(rest);
    return <>{parts}</>;
  };

  useEffect(() => {
    if (reduceMotion) return;
    // Apply dynamic glitch to any .glitch-text-2 nodes after render/typing
    const els = Array.from(document.querySelectorAll('.glitch-text-2')) as HTMLElement[];
    els.forEach((el) => applyDynamicGlitch(el));
  }, [currentText, reduceMotion]);

  return (
    <div className="absolute inset-0 z-[80] bg-black flex flex-col items-center overflow-y-auto p-4 sm:p-8 font-mono select-none">
      <div className="my-auto w-full max-w-3xl max-h-full flex flex-col gap-4 sm:gap-6">
        {/* Header */}
        <div
          className={`shrink-0 flex flex-wrap items-start gap-x-4 gap-y-3 border-b-2 border-dashed ${ep.color ? ep.color.replace('text-', 'border-') : 'border-zinc-500'} pb-4 duration-1000`}
        >
          <div className="flex-1 basis-full sm:basis-auto min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Terminal size={32} className={`hidden sm:block ${ep.color}`} />
              <h1
                className={`text-xl sm:text-4xl font-bold tracking-tighter ${episode.color} uppercase glitch-text`}
                data-text={episode.title}
              >
                {episode.title}
              </h1>
            </div>
            <p className="text-zinc-500 text-sm sm:text-xl tracking-[0.2em] font-bold uppercase">
              {'//'} {ep.subtitle}
            </p>
          </div>
          <SkipIntroButton className="shrink-0" />
        </div>

        {/* Content - Current Section */}
        <div
          ref={logRef}
          role="region"
          aria-label="Episode log"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable region must be focusable to scroll by keyboard
          tabIndex={0}
          className="min-h-24 overflow-y-auto space-y-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400"
        >
          {currentText.split('\n').map((line, idx, arr) => (
            <p
              key={idx}
              className={`text-lg leading-relaxed border-l-2 border-zinc-800 pl-4 ${getSectionStyle(line)}`}
            >
              {renderLine(line)}
              {idx === arr.length - 1 && !showContinue && (
                <span className="inline-block w-2.5 h-5 bg-orange-500 ml-1 animate-pulse" />
              )}
            </p>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="shrink-0 flex items-center gap-2 text-zinc-600 text-sm">
          {sections.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx < sectionIndex
                  ? 'w-8 bg-orange-500'
                  : idx === sectionIndex
                    ? 'w-12 bg-orange-400 animate-pulse'
                    : 'w-4 bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex justify-between items-center transition-opacity duration-300 opacity-100">
          {/* Left instruction for non-final sections (always visible) */}
          {sectionIndex < sections.length - 1 && (
            <div className="text-zinc-300 text-sm flex items-center gap-2">
              <ChevronRight size={16} className="animate-pulse" />
              <span>Press Shift+Enter to continue</span>
            </div>
          )}

          {/* Right: initialize button shown only on last section */}
          {sectionIndex >= sections.length - 1 && (
            <button
              onClick={() => onComplete()}
              className={`flex flex-col items-start gap-1 ${ep.color} hover:text-white transition-colors group text-lg font-bold tracking-widest uppercase`}
            >
              <span className={`text-xs ${ep.color} font-medium tracking-wide text-left`}>
                Press Shift+Enter to
              </span>
              <div className="flex items-center gap-2">
                <span>Initialize System</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Background visual noise */}
      {!reduceMotion && <Scanlines />}
    </div>
  );
};
