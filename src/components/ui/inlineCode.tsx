import React from 'react';

export const renderInlineCode = (
  text: string,
  chipClassName = 'rounded-xs bg-zinc-800 px-1 text-amber-200'
): React.ReactNode =>
  text.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
      <code key={index} className={chipClassName}>
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
