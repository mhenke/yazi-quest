import React from 'react';

interface ThreatAlertProps {
  message: string;
  onDismiss: () => void;
}

export const ThreatAlert: React.FC<ThreatAlertProps> = ({ message, onDismiss }) => {
  return (
    <div 
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown cursor-pointer"
      onClick={onDismiss}
    >
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-orange-400 flex items-center gap-3 min-w-[400px]">
        <div className="text-2xl animate-pulse">⚠️</div>
        <div className="font-mono text-sm font-bold tracking-wide">{message}</div>
        <div className="text-xs opacity-75 ml-auto">(click to dismiss)</div>
      </div>
    </div>
  );
};
