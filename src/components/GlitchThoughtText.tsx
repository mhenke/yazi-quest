import React from 'react';

interface GlitchThoughtTextProps {
  text: string;
}

export const GlitchThoughtText: React.FC<GlitchThoughtTextProps> = ({ text }) => {
  return (
    <div className="glitch-thought">
      <span className="glitch-layer-1">{text}</span>
      <span className="glitch-layer-2">{text}</span>
      <span className="glitch-layer-3">{text}</span>
      <span className="base-text">{text}</span>
    </div>
  );
};
