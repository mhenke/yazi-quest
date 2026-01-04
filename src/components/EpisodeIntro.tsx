import React, { useEffect, useState } from "react";
import { Terminal, ArrowRight, ChevronRight } from "lucide-react";

import { Episode } from "../types";

interface EpisodeIntroProps {
  episode: Episode;
  onComplete: () => void;
}

export const EpisodeIntro: React.FC<EpisodeIntroProps> = ({ episode, onComplete }) => {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [showContinue, setShowContinue] = useState(false);

  // Split lore into sections (separated by empty strings) - useMemo to avoid recalculation
  const sections = React.useMemo(() => {
    const result: string[][] = [];
    let currentSection: string[] = [];

    episode.lore.forEach(line => {
      if (line === "") {
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

    const fullText = sections[sectionIndex].join("\n");
    let charIdx = 0;
    setCurrentText("");
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
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();

        if (!showContinue) {
          // Skip typing animation for current section
          setCurrentText(sections[sectionIndex]?.join("\n") || "");
          setShowContinue(true);
        } else if (sectionIndex < sections.length - 1) {
          // Move to next section
          setSectionIndex(prev => prev + 1);
        } else {
          // Complete intro
          onComplete();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showContinue, sectionIndex, sections, onComplete]);

  // Determine styling based on content
  const getSectionStyle = (text: string) => {
    if (text.startsWith("[") || text.includes(">>>")) {
      return "text-green-400 font-bold"; // System/terminal output
    }
    if (text.toUpperCase() === text && text.length > 10) {
      return "text-orange-400 font-bold tracking-wide"; // Headers
    }
    return "text-zinc-300"; // Normal text
  };

  return (
    <div className="absolute inset-0 z-[80] bg-black flex flex-col items-center justify-center p-8 font-mono select-none">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div
          className={`border-b-2 border-dashed ${episode.color.replace("text-", "border-")} pb-4 mb-8 opacity-0 animate-in fade-in duration-1000`}
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
            {"//"} {episode.subtitle}
          </p>
        </div>

        {/* Content - Current Section */}
        <div className="min-h-[320px] space-y-3">
          {currentText.split("\n").map((line, idx) => (
            <p
              key={idx}
              className={`text-lg leading-relaxed border-l-2 border-zinc-800 pl-4 ${getSectionStyle(line)}`}
            >
              {line}
              {idx === currentText.split("\n").length - 1 && !showContinue && (
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
                  ? "w-8 bg-orange-500"
                  : idx === sectionIndex
                    ? "w-12 bg-orange-400 animate-pulse"
                    : "w-4 bg-zinc-800"
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          className={`pt-4 flex justify-between items-center transition-opacity duration-300 ${showContinue ? "opacity-100" : "opacity-0"}`}
        >
          <div className="text-zinc-600 text-sm flex items-center gap-2">
            <ChevronRight size={16} className="animate-pulse" />
            <span>
              Press Enter to {sectionIndex < sections.length - 1 ? "continue" : "initialize"}
            </span>
          </div>

          {sectionIndex >= sections.length - 1 && (
            <button
              onClick={onComplete}
              className={`flex items-center gap-2 ${episode.color} hover:text-white transition-colors group text-lg font-bold tracking-widest uppercase`}
            >
              <span>Initialize System</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
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
