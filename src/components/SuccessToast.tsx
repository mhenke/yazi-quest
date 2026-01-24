import React, { useEffect } from 'react';

interface SuccessToastProps {
  message: string;
  levelTitle: string;
  onDismiss: () => void; // Shift+Enter - advances to next level
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ message, levelTitle, onDismiss }) => {
  // Keyboard handler to advance to next level
  useEffect(() => {
    console.log('[DEBUG] SuccessToast MOUNTED', { message, levelTitle });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        onDismiss(); // Advances to next level
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      console.log('[DEBUG] SuccessToast UNMOUNTED');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss, message, levelTitle]);

  return (
    <div
      className="fixed top-0 left-0 w-full h-full bg-red-500 z-[9999] flex items-center justify-center text-white text-4xl font-bold"
      data-testid="mission-complete"
      role="alert"
    >
      Mission Complete DEBUG
    </div>
  );
};
