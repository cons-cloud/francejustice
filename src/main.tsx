import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { I18nProvider } from './i18n'
import App from './App.tsx'

// Suppress unhandled third-party browser extension errors and auto-recover from deployment chunk 404s
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    if (import.meta.env.PROD) {
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last_chunk_reload', now.toString());
        window.location.reload();
      }
    }
  });

  window.addEventListener('error', (event) => {
    if (
      event.message?.includes("reading 'startTime'") ||
      event.message?.includes('reportAllChanges') ||
      (event.filename === '' && event.message?.includes('startTime'))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (
      event.message?.includes('Failed to fetch dynamically imported module') ||
      event.message?.includes('Importing a module script failed') ||
      event.message?.includes('error loading dynamically imported module')
    ) {
      if (import.meta.env.PROD) {
        const lastReload = sessionStorage.getItem('last_chunk_reload');
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('last_chunk_reload', now.toString());
          window.location.reload();
        }
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
