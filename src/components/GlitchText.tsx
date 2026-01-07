import React from 'react';

interface GlitchTextProps {
  children: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ children }) => {
  return (
    <span className="glitch-text-3" data-text={children}>
      {children}
    </span>
  );
};
