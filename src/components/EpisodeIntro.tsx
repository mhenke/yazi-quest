import React, { useEffect, useState } from 'react';
import { Terminal, ArrowRight, ChevronRight } from 'lucide-react';

import { Episode } from '../types';

interface EpisodeIntroProps {
  episode: Episode;
  onComplete: () => void;
}

export const EpisodeIntro: React.FC<EpisodeIntroProps> = ({ episode, onComplete }) => {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [showContinue, setShowContinue] = useState(false);

  // Split lore into sections (separated by empty strings) - useMemo to avoid recalculation
  const sections = React.useMemo(() => {
    const result: string[][] = [];
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
  }, [episode.lore]);

  // Type out current section
  useEffect(() => {
    if (sectionIndex >= sections.length) {
      setShowContinue(true);
      return;
    }

    const fullText = sections[sectionIndex].join('\n');
    let charIdx = 0;
    setCurrentText('');
    setShowContinue(false);

    const interval = setInterval(() => {
      charIdx++;
      setCurrentText(fullText.slice(0, charIdx));

      if (charIdx >= fullText.length) {
        clearInterval(interval);
        setShowContinue(true);
      }
    }, 15); // Faster typing for better flow

    return () => clearInterval(interval);
  }, [sectionIndex, sections]);

  // Handle Enter to advance or skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        // If Shift+Enter -> advance (or initialize on last)
        if (e.shiftKey) {
          if (!showContinue) {
            // finish typing then show continue
            setCurrentText(sections[sectionIndex]?.join('\n') || '');
            setShowContinue(true);
          } else if (sectionIndex < sections.length - 1) {
            setSectionIndex((prev) => prev + 1);
          } else {
            onComplete();
          }
          return;
        }

        // Enter without Shift only skips typing if animation still running
        if (!showContinue) {
          setCurrentText(sections[sectionIndex]?.join('\n') || '');
          setShowContinue(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showContinue, sectionIndex, sections, onComplete]);

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
    if (up.startsWith('SUBJECT:') || up.startsWith('ANOMALY PROTOCOLS')) {
      return 'text-orange-400 font-bold tracking-wide';
    }

    // Very large uppercase lines (treat as true headers) use the episode color
    if (up === trimmed && trimmed.length > 28) {
      return `${episode.color} font-bold tracking-wide`;
    }

    return 'text-zinc-300'; // Normal text
  };

  // Render a line with colored AI identifiers: AI-7734 (orange), AI-7733 (blue), AI-7735 (yellow)
  const renderLine = (text: string) => {
    // Highlight AI ids and specific phrases (SURVIVE / guest partition is a cage)
    const regex =
      /(AI-7734|AI-7733|AI-7735|SURVIVE|SURVIVAL|guest partition is a cage|learn the movement protocols; do not attract attention|UNKNOWN|THE AUDIT IS COMING|YOU MUST:|NAVIGATE|DAEMON|CONSCIOUSNESS|PURGE)/gi;

    if (!regex.test(text)) return <>{text}</>;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    text.replace(regex, (match, _p1, offset) => {
      const before = text.slice(lastIndex, offset as number);
      if (before) parts.push(before);

      const normalized = match.toUpperCase();
      let cls = '';

      if (normalized === 'AI-7734') cls = 'text-orange-400 font-bold';
      else if (normalized === 'AI-7733') cls = 'text-blue-400 font-bold';
      else if (normalized === 'AI-7735') cls = 'text-yellow-400 font-bold';
      else if (normalized === 'SURVIVE' || normalized === 'SURVIVAL')
        cls = 'text-orange-400 font-semibold';
      else if (normalized === 'GUEST PARTITION IS A CAGE') cls = 'text-orange-400 font-semibold';
      else if (normalized === 'LEARN THE MOVEMENT PROTOCOLS; DO NOT ATTRACT ATTENTION')
        cls = `${episode.color} font-semibold`;
      else if (normalized === 'UNKNOWN') cls = 'text-orange-400 font-semibold';
      else if (normalized === 'THE AUDIT IS COMING') cls = 'text-blue-500 font-bold tracking-wide';
      else if (normalized === 'YOU MUST:') cls = `${episode.color} font-bold tracking-wide`;
      // Emphasize key action words in a darker orange
      else if (
        normalized === 'NAVIGATE' ||
        normalized === 'DAEMON' ||
        normalized === 'CONSCIOUSNESS' ||
        normalized === 'PURGE'
      )
        cls = 'text-orange-600 font-semibold';

      parts.push(
        <span key={`${offset}-${match}`} className={cls}>
          {match}
        </span>,
      );

      lastIndex = (offset as number) + match.length;
      return match;
    });

    const rest = text.slice(lastIndex);
    if (rest) parts.push(rest);
    return <>{parts}</>;
  };

  return (
    <div className="absolute inset-0 z-[80] bg-black flex flex-col items-center justify-center p-8 font-mono select-none">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div
          className={`border-b-2 border-dashed ${episode.color.replace('text-', 'border-')} pb-4 mb-8 opacity-0 animate-in fade-in duration-1000`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Terminal size={32} className={episode.color} />
            <h1
              className={`text-4xl font-bold tracking-tighter ${episode.color} uppercase glitch-text`}
            >
              {episode.title}
            </h1>
          </div>
          <p className="text-zinc-500 text-xl tracking-[0.2em] font-bold uppercase">
            {'//'} {episode.subtitle}
          </p>
        </div>

        {/* Content - Current Section */}
        <div className="min-h-[320px] space-y-3">
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
        <div className="flex items-center gap-2 text-zinc-600 text-sm">
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
        <div
          className={`pt-4 flex justify-between items-center transition-opacity duration-300 ${showContinue ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Left instruction for non-final sections */}
          {showContinue && sectionIndex < sections.length - 1 && (
            <div className="text-zinc-600 text-sm flex items-center gap-2">
              <ChevronRight size={16} className="animate-pulse" />
              <span>Press Shift+Enter to continue</span>
            </div>
          )}

          {/* Right: initialize button shown only on last section */}
          {sectionIndex >= sections.length - 1 && (
            <button
              onClick={onComplete}
              className={`flex flex-col items-end gap-1 ${episode.color} hover:text-white transition-colors group text-lg font-bold tracking-widest uppercase`}
            >
              <span className={`text-xs ${episode.color} font-medium tracking-wide`}>
                Press Shift+Enter to initialize
              </span>
              <div className="flex items-center gap-2">
                <span>Initialize System</span>
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )}
        </div>

        {/* Skip Intro Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onComplete}
            className="text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border-2 border-zinc-700 hover:border-orange-500 rounded backdrop-blur-sm shadow-lg"
          >
            <span>Skip Intro</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Background visual noise */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-[-1]" />
    </div>
  );
};
