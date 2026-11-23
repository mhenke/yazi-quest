import React from 'react';

interface ScanlinesProps {
  className?: string;
}

export const Scanlines: React.FC<ScanlinesProps> = ({ className = 'opacity-5 z-[-1]' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] ${className}`}
    />
  );
};
