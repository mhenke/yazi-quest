import React, { useEffect, useState } from "react";
import { Episode } from "../types";
import { Terminal, ArrowRight } from "lucide-react";

interface EpisodeIntroProps {
  episode: Episode;
  onComplete: () => void;
}

export const EpisodeIntro: React.FC<EpisodeIntroProps> = ({ episode, onComplete }) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (currentLineIdx >= episode.lore.length) {
      setIsTyping(false);
      return;
    }

    const currentLineText = episode.lore[currentLineIdx];
    let charIdx = 0;

    // Start with an empty line
    setDisplayedLines(prev => [...prev, ""]);

    const interval = setInterval(() => {
      charIdx++;

      setDisplayedLines(prev => {
        const newLines = [...prev];
        newLines[currentLineIdx] = currentLineText.slice(0, charIdx);
        return newLines;
      });

      if (charIdx === currentLineText.length) {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentLineIdx(prev => prev + 1);
        }, 600); // Pause between lines
      }
    }, 30); // Typing speed

    return () => clearInterval(interval);
  }, [currentLineIdx, episode.lore]);

  // Handle Enter to skip or proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        if (isTyping) {
          // Instant finish
          setDisplayedLines(episode.lore);
          setIsTyping(false);
          setCurrentLineIdx(episode.lore.length);
        } else {
          onComplete();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTyping, onComplete, episode.lore]);

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

        {/* Content */}
        <div className="space-y-4 min-h-[300px]">
          {displayedLines.map((line, idx) => (
            <p
              key={idx}
              className="text-zinc-300 text-lg leading-relaxed border-l-2 border-zinc-800 pl-4"
            >
              {line}
              {idx === displayedLines.length - 1 && isTyping && (
                <span className="inline-block w-2.5 h-5 bg-orange-500 ml-1 animate-pulse" />
              )}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div
          className={`pt-8 flex justify-end transition-opacity duration-500 ${!isTyping ? "opacity-100" : "opacity-0"}`}
        >
          <button
            onClick={onComplete}
            className={`flex items-center gap-2 ${episode.color} hover:text-white transition-colors group text-lg font-bold tracking-widest uppercase animate-pulse`}
          >
            <span>Initialize System</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Background visual noise */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-[-1]" />
    </div>
  );
};
