import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

// Tự động định tuyến API trực tiếp về backend Render khi chạy trên Production (Vercel)
// Tránh lỗi timeout 504 và sự chậm trễ của Vercel serverless proxy
if (typeof window !== 'undefined') {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal) {
    const rawFetch = window.fetch;
    const backendUrl = (import.meta.env.VITE_API_URL || 'https://ktd-store.onrender.com').replace(/\/+$/, '');
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === 'string') {
        if (input.startsWith('/api/') || input === '/api') {
          return rawFetch(`${backendUrl}${input}`, init);
        }
      } else if (input instanceof URL && input.origin === window.location.origin && input.pathname.startsWith('/api')) {
        return rawFetch(`${backendUrl}${input.pathname}${input.search}`, init);
      } else if (typeof Request !== 'undefined' && input instanceof Request) {
        try {
          const parsed = new URL(input.url);
          if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/api')) {
            return rawFetch(new Request(`${backendUrl}${parsed.pathname}${parsed.search}`, input), init);
          }
        } catch {
          // fallback to rawFetch
        }
      }
      return rawFetch(input, init);
    };
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);

