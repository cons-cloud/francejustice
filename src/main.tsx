import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { I18nProvider } from './i18n'
import App from './App.tsx'

// Suppress unhandled third-party browser extension errors (e.g. Chrome Web Vitals / performance observer extensions)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes("reading 'startTime'") ||
      event.message?.includes('reportAllChanges') ||
      (event.filename === '' && event.message?.includes('startTime'))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
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
