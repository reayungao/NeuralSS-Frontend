import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ScreenshotProvider } from './contexts/ScreenshotContext';
import { SearchProvider } from './contexts/SearchContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ScreenshotProvider>
      <SearchProvider>
        <App />
      </SearchProvider>
    </ScreenshotProvider>
  </React.StrictMode>
);
