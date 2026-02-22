// Layout Component - Main application layout with sidebar

import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Folder, 
  Bell, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { settingsRepository } from '../../features/settings/services/settingsRepository';
import './Layout.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/items', icon: Package, label: 'Items' },
  { path: '/categories', icon: Folder, label: 'Categories' },
  { path: '/reminders', icon: Bell, label: 'Reminders' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    // Apply theme
    const effectiveTheme = settingsRepository.getEffectiveTheme();
    setTheme(effectiveTheme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const settings = settingsRepository.get();
      if (settings.theme === 'system') {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    settingsRepository.save({ theme: newTheme });
  };
  
  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="layout-header mobile-only">
        <button 
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="logo">OThings</span>
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>
      
      {/* Sidebar */}
      <aside className={`layout-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="logo desktop-only">OThings</span>
          <button 
            className="theme-toggle desktop-only"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
              end={path === '/'}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <span className="version">v1.0.0</span>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
