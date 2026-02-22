import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/shared/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Items } from '@/pages/Items';
import { Categories } from '@/pages/Categories';
import { Reminders } from '@/pages/Reminders';
import { Settings } from '@/pages/Settings';
import { initDatabase } from '@/shared/db';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ fontSize: '32px', fontWeight: 600 }}>OThings</div>
      <div style={{ color: '#666' }}>Loading...</div>
    </div>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[App] Initializing...');
    initDatabase()
      .then(() => {
        console.log('[App] DB ready');
        setReady(true);
      })
      .catch((e) => {
        console.error('[App] DB error:', e);
        setError(e.message);
        // Continue anyway
        setReady(true);
      });
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="items" element={<Items />} />
            <Route path="categories" element={<Categories />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
