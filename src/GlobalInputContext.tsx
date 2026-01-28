import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';

export enum InputPriority {
  GLOBAL = 1000, // Meta keys that work everywhere (Alt+M)
  CRITICAL = 200, // Boot, Intro, Outro
  MODAL_HIGH = 100, // GameOver
  MODAL = 50, // Help, SuccessToast
  GAME = 0, // Normal Gameplay
}

type InputHandler = (e: KeyboardEvent) => boolean | void;

interface Listener {
  id: string;
  priority: number;
  handler: InputHandler;
}

interface GlobalInputContextType {
  register: (id: string, handler: InputHandler, priority: number) => void;
  unregister: (id: string) => void;
}

const GlobalInputContext = createContext<GlobalInputContextType | null>(null);

export const useGlobalInputContext = () => {
  const context = useContext(GlobalInputContext);
  if (!context) {
    throw new Error('useGlobalInputContext must be used within a GlobalInputProvider');
  }
  return context;
};

export const GlobalInputProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listenersRef = useRef<Listener[]>([]);

  const register = useCallback((id: string, handler: InputHandler, priority: number) => {
    // Prepend new listener to ensure LIFO behavior for same-priority items (Stack)
    listenersRef.current = [
      { id, handler, priority },
      ...listenersRef.current.filter((l) => l.id !== id),
    ].sort((a, b) => b.priority - a.priority); // Descending priority, stable sort keeps insertion order (Newest first)
  }, []);

  const unregister = useCallback((id: string) => {
    listenersRef.current = listenersRef.current.filter((l) => l.id !== id);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const listeners = listenersRef.current;
      for (const listener of listeners) {
        const result = listener.handler(e);
        if (result === true) {
          // Stop propagation to lower priorities
          break;
        }
      }
    };

    // We can also listen for keyup if needed, but the current app mostly uses keydown.
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <GlobalInputContext.Provider value={{ register, unregister }}>
      {children}
    </GlobalInputContext.Provider>
  );
};
