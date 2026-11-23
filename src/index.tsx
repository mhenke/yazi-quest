import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { GlobalInputProvider } from './GlobalInputContext';

// The CSS touch gate hides #root on touch devices; skip mounting so boot timers,
// typewriter, and Web Audio never start behind it. Mirrors the stylesheet's media query.
const touchOnly = window.matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false;

if (touchOnly) {
  document.getElementById('root')?.setAttribute('hidden', '');
} else {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Could not find root element to mount to');
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <GlobalInputProvider>
          <App />
        </GlobalInputProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
