import { useLayoutEffect, useId, useRef } from 'react';
import { useGlobalInputContext } from '../GlobalInputContext';

interface UseGlobalInputOptions {
  disabled?: boolean;
}

/**
 * Hook to register a global keyboard listener with a specific priority.
 *
 * @param handler The event handler. Return `true` to stop propagation to lower priorities.
 * @param priority The priority of the listener (higher numbers run first).
 * @param options Configuration options (e.g., disabled).
 */
export const useGlobalInput = (
  handler: (e: KeyboardEvent) => boolean | void,
  priority: number,
  options: UseGlobalInputOptions = {}
) => {
  const { register, unregister } = useGlobalInputContext();
  const id = useId();
  const handlerRef = useRef(handler);

  // Keep handler up to date without re-registering
  useLayoutEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useLayoutEffect(() => {
    if (options.disabled) {
      unregister(id);
      return;
    }

    // Wrap handler to use current ref
    const wrappedHandler = (e: KeyboardEvent) => {
      return handlerRef.current(e);
    };

    register(id, wrappedHandler, priority);

    return () => {
      unregister(id);
    };
  }, [id, priority, register, unregister, options.disabled]);
};
