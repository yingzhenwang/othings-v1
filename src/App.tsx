import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ErrorBoundary } from './components';
import { initDatabase } from './services/database';
import { isFileSystemAccessSupported } from './services/storage';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ItemsList = lazy(() => import('./pages/ItemsList').then(m => ({ default: m.ItemsList })));
const ItemForm = lazy(() => import('./pages/ItemForm').then(m => ({ default: m.ItemForm })));
const Categories = lazy(() => import('./pages/Categories').then(m => ({ default: m.Categories })));
const Reminders = lazy(() => import('./pages/Reminders').then(m => ({ default: m.Reminders })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/50 mb-6">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
            Stuff Manager
          </h1>
          <p className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>
            Personal Belongings Inventory
          </p>
        </div>

        <div className="card p-8 space-y-6" style={{
          background: 'var(--color-bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--color-border)'
        }}>
          <p className="text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Welcome! Create a new database or open an existing one to start managing your inventory.
            {isFileSystemAccessSupported() && ' Choose a cloud-synced folder for backup.'}
          </p>

          {!isFileSystemAccessSupported() && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <p className="text-sm" style={{ color: 'var(--color-warning)' }}>
                File System Access API is not supported in your browser. Please use Chrome or Edge for full functionality.
              </p>
            </div>
          )}

          <button
            onClick={onContinue}
            className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-indigo-500/30"
          >
            Get Started
          </button>
        </div>

        <p className="text-center text-sm mt-8" style={{ color: 'var(--color-text-muted)' }}>
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}

function App() {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleContinue = () => {
    setInitialized(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 animate-ping opacity-20" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
          <p className="text-indigo-300 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return <WelcomeScreen onContinue={handleContinue} />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="items" element={<ItemsList />} />
              <Route path="items/new" element={<ItemForm />} />
              <Route path="items/:id" element={<ItemForm />} />
              <Route path="items/:id/edit" element={<ItemForm />} />
              <Route path="categories" element={<Categories />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
