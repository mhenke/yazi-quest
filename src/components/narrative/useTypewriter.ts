import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseTypewriterOptions {
  speed?: number;
  key?: unknown;
  onComplete?: () => void;
  immediate?: boolean;
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

interface StartIntervalArgs {
  content: string | string[];
  isLines: boolean;
  speed: number;
  onText: (text: string) => void;
  onLine: (line: string) => void;
  onFinish: () => void;
}

const isSameRun = (
  prev: { content: string | string[]; key: unknown; immediate: boolean },
  content: string | string[],
  key: unknown,
  immediate: boolean
): boolean => prev.content === content && prev.key === key && prev.immediate === immediate;

const startTypewriterInterval = ({
  content,
  isLines,
  speed,
  onText,
  onLine,
  onFinish,
}: StartIntervalArgs): (() => void) => {
  let cancelled = false;
  let index = 0;

  const stop = () => {
    cancelled = true;
    clearInterval(interval);
  };

  const interval = setInterval(() => {
    if (cancelled) return;
    if (isLines) {
      if (index < content.length) {
        const line = content[index];
        if (typeof line === 'string') onLine(line);
        index++;
        return;
      }
      stop();
      onFinish();
      return;
    }

    index++;
    onText((content as string).slice(0, index));
    if (index >= content.length) {
      stop();
      onFinish();
    }
  }, speed);

  return stop;
};

const resolveTypewriterOptions = (isLines: boolean, options?: UseTypewriterOptions) => ({
  speed: options?.speed ?? (isLines ? 100 : 15),
  key: options?.key,
  onComplete: options?.onComplete,
  immediate: options?.immediate ?? false,
});

const resolveTypewriterOutput = (
  content: string | string[],
  isLines: boolean,
  immediate: boolean,
  displayedText: string,
  displayedLines: string[],
  isComplete: boolean
) => ({
  text: immediate && !isLines ? (content as string) : displayedText,
  lines: immediate && isLines ? (content as string[]) : displayedLines,
  complete: immediate || isComplete,
});

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
  const isEmpty = content.length === 0;
  const { speed, key, onComplete, immediate } = resolveTypewriterOptions(isLines, options);

  const [prevRun, setPrevRun] = useState({ content, key, immediate });
  const [displayedText, setDisplayedText] = useState('');
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(isEmpty);
  const stopRef = useRef<(() => void) | null>(null);

  if (!isSameRun(prevRun, content, key, immediate)) {
    setPrevRun({ content, key, immediate });
    setDisplayedText('');
    setDisplayedLines([]);
    setIsComplete(isEmpty);
  }

  useEffect(() => {
    if (immediate || isEmpty) {
      onComplete?.();
      return;
    }

    const stop = startTypewriterInterval({
      content,
      isLines,
      speed,
      onText: setDisplayedText,
      onLine: (line) => setDisplayedLines((prev) => [...prev, line]),
      onFinish: () => {
        stopRef.current = null;
        setIsComplete(true);
        onComplete?.();
      },
    });
    stopRef.current = stop;

    return () => {
      stop();
      stopRef.current = null;
    };
  }, [content, isLines, isEmpty, speed, key, onComplete, immediate]);

  const skip = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    if (isLines) {
      setDisplayedLines(content as string[]);
    } else {
      setDisplayedText(content as string);
    }
    setIsComplete(true);
    onComplete?.();
  }, [content, isLines, onComplete, setDisplayedLines, setDisplayedText, setIsComplete]);

  const { text, lines, complete } = resolveTypewriterOutput(
    content,
    isLines,
    immediate,
    displayedText,
    displayedLines,
    isComplete
  );
  return {
    displayedText: text,
    text,
    displayedLines: lines,
    lines,
    isComplete: complete,
    showContinue: complete,
    skip,
    setDisplayedText,
    setDisplayedLines,
    setIsComplete,
  };
}

export * from './useSkipIntro';
export * from './SkipIntroButton';
export * from './Scanlines';
