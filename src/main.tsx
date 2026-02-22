import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDatabase } from '@/shared/db'

console.log('[main] Starting app...');

try {
  initDatabase()
    .then(() => {
      console.log('[main] DB initialized');
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    })
    .catch((err) => {
      console.error('[main] DB init failed:', err);
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    });
} catch (e) {
  console.error('[main] Error:', e);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <div style={{ padding: 20 }}>
        <h1>OThings</h1>
        <p>Error: {String(e)}</p>
      </div>
    </StrictMode>,
  );
}
