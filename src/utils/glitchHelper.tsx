import React from 'react';
import { GlitchText } from '../components/GlitchText';

/**
 * Parses a string for `{keyword}` syntax and replaces them with a <GlitchText> component.
 * @param text The string to parse.
 * @returns A React.ReactNode with keywords replaced by glitching components.
 */
export function parseWithGlitch(text: string): React.ReactNode {
  if (!text) {
    return text;
  }

  const parts = text.split(/({[^{}]+})/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('{') && part.endsWith('}')) {
          const word = part.substring(1, part.length - 1);
          return <GlitchText key={i}>{word}</GlitchText>;
        }
        return part;
      })}
    </>
  );
}
