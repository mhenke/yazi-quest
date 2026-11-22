import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useState } from 'react';

export interface UseTypewriterOptions {
  speed?: number;
  key?: unknown;
  onComplete?: () => void;
}

export interface UseTypewriterResult {
  displayedText: string;
  text: string;
  displayedLines: string[];
  lines: string[];
  isComplete: boolean;
  showContinue: boolean;
  skip: () => void;
  setDisplayedText: Dispatch<SetStateAction<string>>;
  setDisplayedLines: Dispatch<SetStateAction<string[]>>;
  setIsComplete: Dispatch<SetStateAction<boolean>>;
}

export function useTypewriter(content: string, options?: UseTypewriterOptions): UseTypewriterResult;
export function useTypewriter(
  content: string[],
  options?: UseTypewriterOptions
): UseTypewriterResult;
export function useTypewriter(
  content: string | string[],
  options?: UseTypewriterOptions
): UseTypewriterResult {
  const isLines = Array.isArray(content);
  const speed = options?.speed ?? (isLines ? 100 : 15);
  const key = options?.key;
  const onComplete = options?.onComplete;

  const [displayedText, setDisplayedText] = useState('');
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsComplete(false);

    if (isLines) {
      setDisplayedLines([]);
      let currentLine = 0;

      if (content.length === 0) {
        setIsComplete(true);
        onComplete?.();
        return;
      }

      const interval = setInterval(() => {
        if (cancelled) return;
        if (currentLine < content.length) {
          const lineToAdd = content[currentLine];
          if (typeof lineToAdd === 'string') {
            setDisplayedLines((prev) => [...prev, lineToAdd]);
          }
          currentLine++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    } else {
      let charIdx = 0;
      setDisplayedText('');

      if (!content) {
        setIsComplete(true);
        onComplete?.();
        return;
      }

      const interval = setInterval(() => {
        if (cancelled) return;
        charIdx++;
        setDisplayedText(content.slice(0, charIdx));

        if (charIdx >= content.length) {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
  }, [content, isLines, speed, key, onComplete]);

  const skip = useCallback(() => {
    if (isLines) {
      setDisplayedLines(content as string[]);
    } else {
      setDisplayedText(content as string);
    }
    setIsComplete(true);
    onComplete?.();
  }, [content, isLines, onComplete]);

  return {
    displayedText,
    text: displayedText,
    displayedLines,
    lines: displayedLines,
    isComplete,
    showContinue: isComplete,
    skip,
    setDisplayedText,
    setDisplayedLines,
    setIsComplete,
  };
}

export * from './useSkipIntro';
export * from './SkipIntroButton';
export * from './Scanlines';
