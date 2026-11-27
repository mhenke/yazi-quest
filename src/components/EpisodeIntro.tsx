import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Terminal, ArrowRight, ChevronRight } from 'lucide-react';

import { Episode } from '../types';
import { paletteFor } from '../constants/palette';
import { applyDynamicGlitch } from '../utils/dynamicGlitch';
import { useGlobalInput } from '../GlobalInputContext';
import { useFileManagerView } from '../hooks/useViewportFloor';
import { Scanlines, SkipIntroButton, useSkipIntro, useTypewriter } from './narrative/useTypewriter';

interface EpisodeIntroProps {
  episode: Episode;
  onComplete: (options?: { isSkip?: boolean }) => void;
  reduceMotion?: boolean;
  showFocusRing?: boolean;
}

const logFocusClass = (showFocusRing: boolean): string =>
  showFocusRing
    ? 'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400'
    : 'focus-visible:outline-hidden';

const advanceIntroSection = (
  sectionIndex: number,
  sectionCount: number,
  setSectionIndex: React.Dispatch<React.SetStateAction<number>>,
  onComplete: (options?: { isSkip?: boolean }) => void
) => {
  if (sectionIndex < sectionCount - 1) setSectionIndex((prev) => prev + 1);
  else onComplete();
};

const applySectionGlitch = (container: HTMLDivElement | null, reduceMotion?: boolean) => {
  if (reduceMotion || !container) return;
  const els = Array.from(container.querySelectorAll('.glitch-text-2')) as HTMLElement[];
  els.forEach((el) => applyDynamicGlitch(el));
};

const handleIntroEnterKey = (
  shiftKey: boolean,
  showContinue: boolean,
  skipTyping: () => void,
  onAdvance: () => void
) => {
  if (shiftKey || showContinue) onAdvance();
  else skipTyping();
};

const EpisodeIntroFooter: React.FC<{
  hasMoreSections: boolean;
  epColor: string;
  onAdvance: () => void;
  onComplete: () => void;
}> = ({ hasMoreSections, epColor, onAdvance, onComplete }) => (
  <div className="shrink-0 min-h-12 flex justify-between items-center transition-opacity duration-300 opacity-100">
    {hasMoreSections ? (
      <button
        type="button"
        onClick={onAdvance}
        className="text-zinc-300 hover:text-white text-sm flex items-center gap-2 min-h-9 px-2 -ml-2 rounded-xs cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        <ChevronRight size={16} aria-hidden="true" />
        <span>Press Shift+Enter to continue</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={onComplete}
        className={`flex flex-col items-start gap-1 ${epColor} hover:text-white transition-colors group text-lg font-bold tracking-widest uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-white`}
      >
        <span className={`text-xs ${epColor} font-medium tracking-wide text-left`}>
          Press Shift+Enter to
        </span>
        <div className="flex items-center gap-2">
          <span>Initialize System</span>
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    )}
  </div>
);

const IntroRequirements: React.FC = () => {
  const canPlay = useFileManagerView();
  return (
    <p className="shrink-0 text-sm leading-relaxed text-zinc-300">
      {!canPlay && 'Gameplay needs a 1024 CSS px window and Ctrl/Alt. '}
      Progress and settings save in this browser when storage is available.
    </p>
  );
};

const splitEpisodeLore = (episode: Episode): string[][] => {
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
  if (currentSection.length > 0) result.push(currentSection);
  return result;
};

const IntroProgress: React.FC<{ sections: string[][]; sectionIndex: number }> = ({
  sections,
  sectionIndex,
}) => (
  <div className="shrink-0 flex items-center gap-2 text-zinc-400 text-sm">
    {sections.map((_, idx) => (
      <div
        key={idx}
        className={`h-1 rounded-full transition-all duration-300 ${
          idx < sectionIndex
            ? 'w-8 bg-orange-500'
            : idx === sectionIndex
              ? 'w-12 bg-orange-400'
              : 'w-4 bg-zinc-800'
        }`}
      />
    ))}
  </div>
);

const TypingCursor: React.FC<{ lastLine: boolean; showContinue: boolean }> = ({
  lastLine,
  showContinue,
}) =>
  lastLine && !showContinue ? (
    <span className="inline-block w-2.5 h-5 bg-orange-500 ml-1 animate-pulse" />
  ) : null;

export const EpisodeIntro: React.FC<EpisodeIntroProps> = ({
  episode,
  onComplete,
  reduceMotion,
  showFocusRing = true,
}) => {
  const ep =
    episode ||
    ({ title: '', subtitle: '', lore: [], color: 'text-blue-500' } as unknown as Episode);
  const [sectionIndex, setSectionIndex] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const visibleSectionRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => splitEpisodeLore(episode), [episode]);

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

  const handleAdvance = () =>
    advanceIntroSection(sectionIndex, sections.length, setSectionIndex, onComplete);

  // Handle Enter to skip typing or advance
  useGlobalInput(
    (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      handleIntroEnterKey(e.shiftKey, showContinue, skipTyping, handleAdvance);
      return true;
    },
    [showContinue, sectionIndex, sections, onComplete, skipTyping],
    { priority: 900 }
  );

  useSkipIntro(onComplete);

  // Each section replaces the scroller so an in-flight PageDown cannot carry into it.
  useEffect(() => {
    logRef.current?.focus({ preventScroll: true });
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
    applySectionGlitch(visibleSectionRef.current, reduceMotion);
  }, [sectionIndex, showContinue, reduceMotion]);

  return (
    <main className="absolute inset-0 z-[80] bg-black flex flex-col items-center overflow-y-auto p-4 sm:p-8 font-mono select-none">
      <div className="my-auto w-full max-w-3xl max-h-full flex flex-col gap-3 sm:gap-6">
        {/* Header */}
        <div
          className={`shrink-0 flex flex-wrap items-start gap-x-4 gap-y-3 border-b-2 border-dashed ${paletteFor(ep.color).border} pb-4 duration-1000`}
        >
          <div className="flex-1 basis-full sm:basis-auto min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Terminal size={32} className={`hidden sm:block ${ep.color}`} aria-hidden="true" />
              <h1
                className={`text-xl sm:text-4xl font-bold tracking-tighter ${episode.color} uppercase glitch-text`}
                data-text={episode.title}
              >
                {episode.title}
              </h1>
            </div>
            <p className="text-zinc-400 text-sm sm:text-xl tracking-[0.2em] font-bold uppercase">
              {'//'} {ep.subtitle}
            </p>
            <p className="hidden sm:block text-xs text-zinc-400 font-mono mt-1.5">
              Interactive Yazi file manager trainer — navigate and operate with real Yazi
              keybindings.
            </p>
          </div>
          <SkipIntroButton className="shrink-0" />
        </div>
        <IntroRequirements />

        {/* Content - Current Section */}
        <div
          key={sectionIndex}
          ref={logRef}
          role="region"
          aria-label="Episode log"
          tabIndex={0}
          className={`min-h-24 overflow-y-auto p-2 [scrollbar-gutter:stable] ${logFocusClass(showFocusRing)}`}
        >
          {/* Invisible full-section copies stacked in one grid cell reserve the tallest section's
              height, so typing and section changes never resize the frame. */}
          <div className="grid">
            {sections.map((lines, sectionIdx) => (
              <div
                key={sectionIdx}
                aria-hidden="true"
                className="invisible col-start-1 row-start-1 space-y-3"
              >
                {lines.map((line, idx) => (
                  <p
                    key={idx}
                    className={`text-lg leading-relaxed border-l-2 border-zinc-800 pl-4 ${getSectionStyle(line)}`}
                  >
                    {renderLine(line)}
                  </p>
                ))}
              </div>
            ))}
            <div ref={visibleSectionRef} className="col-start-1 row-start-1 space-y-3">
              {currentText.split('\n').map((line, idx, arr) => (
                <p
                  key={idx}
                  className={`text-lg leading-relaxed border-l-2 border-zinc-800 pl-4 ${getSectionStyle(line)}`}
                >
                  {renderLine(line)}
                  <TypingCursor lastLine={idx === arr.length - 1} showContinue={showContinue} />
                </p>
              ))}
            </div>
          </div>
        </div>

        <IntroProgress sections={sections} sectionIndex={sectionIndex} />

        {/* Footer */}
        <EpisodeIntroFooter
          hasMoreSections={sectionIndex < sections.length - 1}
          epColor={ep.color}
          onAdvance={handleAdvance}
          onComplete={() => onComplete()}
        />
      </div>

      {/* Background visual noise */}
      {!reduceMotion && <Scanlines />}
    </main>
  );
};
