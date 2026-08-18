import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Ensure window.fetch is safely assignable in sandboxed iframe environments
if (typeof window !== 'undefined') {
  try {
    const origFetch = window.fetch.bind(window);
    let activeFetch = origFetch;
    Object.defineProperty(window, 'fetch', {
      get() {
        return activeFetch;
      },
      set(newFetch) {
        activeFetch = typeof newFetch === 'function' ? newFetch : origFetch;
      },
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    // Ignore if not configurable
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

