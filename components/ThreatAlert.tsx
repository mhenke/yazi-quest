import React from 'react';

interface ThreatAlertProps {
  message: string;
  onDismiss: () => void;
}

export const ThreatAlert: React.FC<ThreatAlertProps> = ({ message, onDismiss }) => {
  return (
    <div 
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] animate-in zoom-in-95 fade-in duration-300 cursor-pointer"
      onClick={onDismiss}
      role="alert"
    >
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-6 rounded-xl shadow-2xl shadow-orange-500/20 border-2 border-orange-400 backdrop-blur-md min-w-[400px] max-w-md flex flex-col items-center text-center">
        <div className="bg-orange-500 rounded-full p-3 mb-4 animate-pulse shadow-lg shadow-orange-500/50">
          <div className="text-3xl">⚠️</div>
        </div>
        
        <div className="font-mono text-lg font-bold tracking-wide mb-3">{message}</div>
        
        <div className="text-xs text-orange-200/70 font-mono uppercase tracking-widest">
          Click to dismiss
        </div>
      </div>
    </div>
  );
};
