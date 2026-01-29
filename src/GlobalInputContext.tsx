import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, ReactNode } from 'react';

type InputHandler = (e: KeyboardEvent) => boolean | void;

interface HandlerOptions {
  priority: number;
  enabled?: boolean;
  captureInput?: boolean; // If true, handler triggers even when focus is in an input/textarea
}

interface RegisteredHandler extends HandlerOptions {
  id: string;
  handler: InputHandler;
}

interface GlobalInputContextType {
  register: (id: string, handler: InputHandler, options: HandlerOptions) => void;
  unregister: (id: string) => void;
}

const GlobalInputContext = createContext<GlobalInputContextType | undefined>(undefined);

export const GlobalInputProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const handlersRef = useRef<RegisteredHandler[]>([]);

  const register = (id: string, handler: InputHandler, options: HandlerOptions) => {
    handlersRef.current = [
      ...handlersRef.current.filter((h) => h.id !== id),
      { id, handler, ...options },
    ];
  };

  const unregister = (id: string) => {
    handlersRef.current = handlersRef.current.filter((h) => h.id !== id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sort handlers by priority (descending)
      const sortedHandlers = [...handlersRef.current].sort((a, b) => b.priority - a.priority);

      // console.log(`[GlobalInput] Key: ${e.key}, Handlers: ${sortedHandlers.length}`);

      const isInput =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      for (const h of sortedHandlers) {
        if (h.enabled === false) continue; // Explicit check for false

        // If focus is in an input, only allow handlers that explicitly opt-in (captureInput)
        if (isInput && !h.captureInput) continue;

        const result = h.handler(e);
        if (result === true || e.defaultPrevented) {
           // If handler returned true, it consumed the event.
           // e.defaultPrevented check allows handlers that called e.preventDefault() to be counted as consuming?
           // No, usually return true is the explicit signal.
           // But let's respect return true.

           if (result === true) {
             // Stop further processing
             e.stopPropagation();
             e.stopImmediatePropagation();
             break;
           }
        }
      }
    };

    // Use capture=true? No, bubble is standard.
    // However, we want to be the "Arbiter".
    // If we attach to window, we are at the top of the bubble chain.
    // So we see it last (after React components).
    // If a React component calls stopPropagation, we might not see it.
    // BUT we are replacing local listeners in components with this Global Arbiter.
    // So the components won't have local listeners anymore (except inputs).
    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <GlobalInputContext.Provider value={{ register, unregister }}>
      {children}
    </GlobalInputContext.Provider>
  );
};

export const useGlobalInput = (
  handler: InputHandler,
  deps: any[],
  options: HandlerOptions
) => {
  const context = useContext(GlobalInputContext);
  if (!context) {
    throw new Error('useGlobalInput must be used within a GlobalInputProvider');
  }

  // Stable ID for this hook instance
  const id = useRef(Math.random().toString(36).substr(2, 9));

  useLayoutEffect(() => {
    const opts = { ...options, enabled: options.enabled ?? true };
    context.register(id.current, handler, opts);

    return () => {
      context.unregister(id.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, options.priority, options.enabled, options.captureInput]);
};
