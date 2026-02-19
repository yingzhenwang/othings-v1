import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  Bell,
  BarChart3,
  Settings,
  Menu,
  X,
  Plus,
  Search,
  Sparkles,
  Home,
} from 'lucide-react';
import { useTheme } from '../hooks/useDatabase';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/items', icon: Package, label: 'Items' },
  { path: '/categories', icon: Tags, label: 'Categories' },
  { path: '/reminders', icon: Bell, label: 'Reminders' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout() {
  const location = useLocation();
  const theme = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'normal' | 'llm'>('normal');

  return (
    <div className="min-h-screen" data-theme={theme}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-20 border-b border-[var(--color-border)]">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 solid var(--color-bg-secondary)" />
          </div>
          <div>
            <h1 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
              Stuff Manager
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">Inventory System</p>
          </div>
          <button
            className="ml-auto lg:hidden p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent text-white border-l-2 border-indigo-500'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSidebarOpen(false)}
              >
                <div className={`relative ${isActive ? 'text-indigo-400' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'}`}>
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <div className="absolute -inset-1 bg-indigo-500/20 rounded-full blur-md" />
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Quick Tip</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Use LLM search for natural language queries
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 h-20 flex items-center justify-between px-4 lg:px-8"
          style={{
            background: 'var(--color-bg-secondary)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Home button - visible on all screens */}
            <Link
              to="/"
              className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
              title="Go to Dashboard"
            >
              <Home className="w-5 h-5" />
            </Link>

            {/* Search */}
            <div className="flex items-center gap-2 hidden md:flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 pr-4 w-56"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </div>
              <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
                <button
                  onClick={() => setSearchMode('normal')}
                  className={`px-3 py-2 text-xs transition-colors ${
                    searchMode === 'normal'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setSearchMode('llm')}
                  className={`px-3 py-2 text-xs transition-colors flex items-center gap-1 ${
                    searchMode === 'llm'
                      ? 'bg-purple-500 text-white'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  AI
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/items/new"
              className="btn btn-primary shadow-lg shadow-indigo-500/25"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Item</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet context={{ searchQuery, refresh: () => window.location.reload() }} />
        </main>
      </div>
    </div>
  );
}
