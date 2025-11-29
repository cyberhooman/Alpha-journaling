import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Log app initialization
console.log('Trading Journal App initializing...');
console.log('User Agent:', navigator.userAgent);
console.log('Platform:', navigator.platform);

// Check if localStorage is available (iOS Safari private mode blocks it)
let isLocalStorageAvailable = false;
try {
  const test = '__localStorage_test__';
  localStorage.setItem(test, test);
  localStorage.removeItem(test);
  isLocalStorageAvailable = true;
  console.log('localStorage is available');
} catch (e) {
  console.warn('localStorage not available, using memory storage fallback', e);
}

// Fallback storage for iOS Safari private mode
const memoryStorage: { [key: string]: string } = {};
const safeStorage = {
  getItem: (key: string) => {
    try {
      return isLocalStorageAvailable ? localStorage.getItem(key) : memoryStorage[key] || null;
    } catch {
      return memoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (isLocalStorageAvailable) {
        localStorage.setItem(key, value);
      } else {
        memoryStorage[key] = value;
      }
    } catch {
      memoryStorage[key] = value;
    }
  },
  removeItem: (key: string) => {
    try {
      if (isLocalStorageAvailable) {
        localStorage.removeItem(key);
      } else {
        delete memoryStorage[key];
      }
    } catch {
      delete memoryStorage[key];
    }
  },
};

// Override localStorage if needed
if (!isLocalStorageAvailable) {
  (window as any).localStorage = safeStorage;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 0, // Data is immediately stale, triggers refetch on invalidate
    },
  },
});

console.log('Rendering React app...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );

  console.log('React app rendered successfully');
} catch (error) {
  console.error('Failed to render React app:', error);

  // Show error message directly in HTML if React fails to load
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; max-width: 600px; margin: 50px auto; background: #fee; border: 2px solid #f00; border-radius: 8px; font-family: system-ui;">
        <h1 style="color: #c00;">Failed to Load App</h1>
        <p>The app failed to initialize. This might be due to:</p>
        <ul>
          <li>Browser compatibility issues</li>
          <li>Blocked resources or scripts</li>
          <li>Network connectivity problems</li>
        </ul>
        <p><strong>Error:</strong> ${error}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}
