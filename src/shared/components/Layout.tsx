// Layout Component - Main application layout with sidebar
import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSettings } from '@/features/settings/hooks/useSettings';
import './Layout.css';

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/items', icon: '📦', label: 'Items' },
  { path: '/categories', icon: '🏷️', label: 'Categories' },
  { path: '/reminders', icon: '⏰', label: 'Reminders' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { settings, updateSettings } = useSettings();

  // Apply theme
  useEffect(() => {
    const theme = settings?.theme || 'system';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, [settings?.theme]);

  const toggleTheme = () => {
    const current = settings?.theme || 'system';
    const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    updateSettings({ theme: next });
  };

  const themeIcon = () => {
    const theme = settings?.theme || 'system';
    if (theme === 'dark') return '🌙';
    if (theme === 'light') return '☀️';
    return '🖥️';
  };

  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="layout-header mobile-only">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span className="logo">OThings</span>
        <button className="theme-toggle" onClick={toggleTheme}>
          {themeIcon()}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`layout-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="logo desktop-only">OThings</span>
          <button className="theme-toggle desktop-only" onClick={toggleTheme}>
            {themeIcon()}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="version">v1.0.0</span>
          <button 
            onClick={() => {
              // Dispatch a custom event or use state to show shortcuts
              const e = new KeyboardEvent('keydown', { key: '?' });
              window.dispatchEvent(e);
            }}
            style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
            title="Keyboard shortcuts"
          >
            ⌨️
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
