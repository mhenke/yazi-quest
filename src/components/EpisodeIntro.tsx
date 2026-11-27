import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Terminal, ArrowRight, ChevronRight } from 'lucide-react';

import { Episode, type LoreLine } from '../types';
import { paletteFor } from '../constants/palette';
import { applyDynamicGlitch } from '../utils/dynamicGlitch';
import { useGlobalInput } from '../GlobalInputContext';
import { useFileManagerView } from '../hooks/useViewportFloor';
import {
  loreLineToText,
  loreSectionToText,
  sliceLoreSection,
  splitLoreSections,
} from '../utils/loreHelpers';
import { renderFullLoreLine, renderSlicedLoreLine } from './narrative/LoreLineView';
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

const IntroProgress: React.FC<{ sections: LoreLine[][]; sectionIndex: number }> = ({
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

const getSectionStyle = (line: LoreLine, epColor: string): string => {
  const trimmed = loreLineToText(line).trim();
  const up = trimmed.toUpperCase();

  if (trimmed.startsWith('[') || trimmed.includes('>>>')) {
    return 'text-green-400 font-bold';
  }
  if (up.startsWith('SUBJECT:')) {
    return 'text-orange-400 font-bold tracking-wide';
  }
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
  if (up === trimmed && trimmed.length > 28) {
    return `${epColor} font-bold tracking-wide`;
  }
  return 'text-zinc-300';
};

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

  const sections = useMemo(() => splitLoreSections(episode?.lore ?? []), [episode]);
  const currentSection = useMemo(() => sections[sectionIndex] ?? [], [sections, sectionIndex]);
  const fullText = useMemo(() => loreSectionToText(currentSection), [currentSection]);

  const {
    text: currentText,
    isComplete: isTextComplete,
    skip: skipTyping,
  } = useTypewriter(fullText, {
    speed: 15,
    key: sectionIndex,
    immediate: reduceMotion,
  });

  const visibleLines = useMemo(
    () => sliceLoreSection(currentSection, currentText.length),
    [currentSection, currentText.length]
  );

  const showContinue = sectionIndex >= sections.length || isTextComplete;

  const handleAdvance = () =>
    advanceIntroSection(sectionIndex, sections.length, setSectionIndex, onComplete);

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

  useEffect(() => {
    applySectionGlitch(visibleSectionRef.current, reduceMotion);
  }, [sectionIndex, currentText.length, reduceMotion]);

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
                    className={`text-lg leading-relaxed border-l-2 border-zinc-800 pl-4 ${getSectionStyle(line, ep.color)}`}
                  >
                    {renderFullLoreLine(line, reduceMotion)}
                  </p>
                ))}
              </div>
            ))}
            <div ref={visibleSectionRef} className="col-start-1 row-start-1 space-y-3">
              {visibleLines.map((runs, idx, arr) => (
                <p
                  key={idx}
                  className={`text-lg leading-relaxed border-l-2 border-zinc-800 pl-4 ${getSectionStyle(currentSection[idx] ?? '', ep.color)}`}
                >
                  {renderSlicedLoreLine(runs, reduceMotion)}
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
