import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { GlobalInputProvider } from './GlobalInputContext';

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
