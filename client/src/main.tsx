import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Check if localStorage is available (iOS Safari private mode blocks it)
let isLocalStorageAvailable = false;
try {
  const test = '__localStorage_test__';
  localStorage.setItem(test, test);
  localStorage.removeItem(test);
  isLocalStorageAvailable = true;
} catch (e) {
  console.warn('localStorage not available, using memory storage fallback');
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
