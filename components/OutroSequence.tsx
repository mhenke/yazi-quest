import React, { useEffect, useState, useRef } from 'react';
import { CONCLUSION_DATA } from '../constants';
import { Terminal, Signal, UploadCloud } from 'lucide-react';

export const OutroSequence: React.FC = () => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [showTeaser, setShowTeaser] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Typewriter effect logic for lore
  useEffect(() => {
    if (currentLineIdx >= CONCLUSION_DATA.lore.length) {
      // Trigger teaser after text is done
      setTimeout(() => setShowTeaser(true), 1500);
      return;
    }

    const currentLineText = CONCLUSION_DATA.lore[currentLineIdx];
    let charIdx = 0;

    setDisplayedLines((prev) => [...prev, '']);

    const interval = setInterval(() => {
      charIdx++;

      setDisplayedLines((prev) => {
        const newLines = [...prev];
        newLines[currentLineIdx] = currentLineText.slice(0, charIdx);
        return newLines;
      });

      if (charIdx === currentLineText.length) {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentLineIdx((prev) => prev + 1);
        }, 800);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [currentLineIdx]);

  // Play video only when teaser is shown
  useEffect(() => {
    if (showTeaser && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((e) => console.error('Video play failed', e));
    }
  }, [showTeaser]);

  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500">
      {/* Narrative Section (Fades out when Teaser starts) */}
      <div
        className={`relative z-20 w-full max-w-3xl p-8 transition-opacity duration-1000 ${showTeaser ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {/* Header */}
        <div className="mb-12 border-l-4 border-red-600 pl-6 animate-in slide-in-from-left duration-1000">
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <Terminal size={28} />
            <h1 className="text-3xl font-bold tracking-wider glitch-text">
              {CONCLUSION_DATA.title}
            </h1>
          </div>
          <p className="text-zinc-500 font-mono tracking-[0.3em] uppercase">
            {CONCLUSION_DATA.subtitle}
          </p>
        </div>

        {/* Typewriter Text */}
        <div className="space-y-4 font-mono">
          {displayedLines.map((line, idx) => (
            <p key={idx} className="text-zinc-300 text-lg md:text-xl leading-relaxed">
              <span className="text-red-500/50 mr-2">{'>'}</span>
              {line}
            </p>
          ))}
        </div>
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
        {showTeaser && (
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
                <span>Establishing Remote Uplink...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
