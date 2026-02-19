import React, { useState } from 'react';
import {
  Save,
  FolderOpen,
  FileJson,
  FileSpreadsheet,
  Moon,
  Sun,
  Monitor,
  Bell,
  Search,
  Sparkles,
  Database,
  Upload,
  MonitorSmartphone,
} from 'lucide-react';
import { useTheme, useSettings } from '../hooks/useDatabase';
import * as storage from '../services/storage';
import * as db from '../services/database';

export function Settings() {
  const theme = useTheme();
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<'data' | 'search' | 'display' | 'notifications'>('data');

  const [formData, setFormData] = useState({
    theme: settings.theme || 'system',
    defaultView: settings.defaultView || 'grid',
    itemsPerPage: settings.itemsPerPage || 20,
    searchMode: settings.searchMode || 'normal',
    llmProvider: settings.llmProvider || 'openai',
    llmApiKey: settings.llmApiKey || '',
    notificationsEnabled: settings.notificationsEnabled ?? true,
    notificationTiming: settings.notificationTiming || 1,
  });

  const handleSave = () => {
    updateSettings(formData);
    localStorage.setItem('theme', formData.theme);
    window.location.reload();
  };

  const tabs = [
    { id: 'data', label: 'Database', icon: Database },
    { id: 'search', label: 'Search & AI', icon: Search },
    { id: 'display', label: 'Appearance', icon: MonitorSmartphone },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Settings</h1>
        <p className="text-[var(--color-text-secondary)]">Manage your app preferences and data</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                Database File
              </h2>
            </div>
            <div className="card-body space-y-4">
              <p className="text-[var(--color-text-secondary)]">
                Your data is stored in a SQLite database file. Choose a location that syncs with your cloud storage (iCloud, OneDrive) for automatic backup.
              </p>

              <div className="flex flex-wrap gap-3">
                <button className="btn btn-primary" onClick={storage.createNewDatabase}>
                  <Save className="w-4 h-4" />
                  New Database
                </button>
                <button className="btn btn-secondary" onClick={storage.openDatabase}>
                  <FolderOpen className="w-4 h-4" />
                  Open File
                </button>
                <button className="btn btn-secondary" onClick={storage.saveDatabase}>
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button className="btn btn-secondary" onClick={storage.saveDatabaseAs}>
                  <FolderOpen className="w-4 h-4" />
                  Save As
                </button>
              </div>

              {settings.dataFilePath && (
                <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                  <p className="text-sm text-[var(--color-text-muted)]">Current file:</p>
                  <p className="font-medium">{settings.dataFilePath}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                Import / Export
              </h2>
            </div>
            <div className="card-body">
              <div className="flex flex-wrap gap-3">
                <button className="btn btn-outline" onClick={storage.exportToJSON}>
                  <FileJson className="w-4 h-4" />
                  Export JSON
                </button>
                <button className="btn btn-outline" onClick={storage.exportToCSV}>
                  <FileSpreadsheet className="w-4 h-4" />
                  Export CSV
                </button>
                <button className="btn btn-outline" onClick={storage.importFromJSON}>
                  <Upload className="w-4 h-4" />
                  Import JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                Search Mode
              </h2>
            </div>
            <div className="card-body">
              <div className="flex gap-3">
                <button
                  className={`flex-1 p-4 rounded-xl border transition-all ${
                    formData.searchMode === 'normal'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-light)]'
                  }`}
                  onClick={() => setFormData({ ...formData, searchMode: 'normal' })}
                >
                  <Search className="w-6 h-6 mx-auto mb-2 text-[var(--color-text-secondary)]" />
                  <p className="font-medium">Normal Search</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Keyword-based filtering</p>
                </button>
                <button
                  className={`flex-1 p-4 rounded-xl border transition-all ${
                    formData.searchMode === 'llm'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-light)]'
                  }`}
                  onClick={() => setFormData({ ...formData, searchMode: 'llm' })}
                >
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                  <p className="font-medium">AI Search</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Natural language queries</p>
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                LLM Provider
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div className="input-group">
                <label className="label">Provider</label>
                <select
                  value={formData.llmProvider}
                  onChange={(e) => setFormData({ ...formData, llmProvider: e.target.value as any })}
                  className="select"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="label">API Key</label>
                <input
                  type="password"
                  value={formData.llmApiKey}
                  onChange={(e) => setFormData({ ...formData, llmApiKey: e.target.value })}
                  className="input"
                  placeholder={formData.llmProvider === 'ollama' ? 'Not required for local' : 'Enter API key'}
                  disabled={formData.llmProvider === 'ollama'}
                />
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {formData.llmProvider === 'ollama'
                    ? 'Ollama runs locally on port 11434'
                    : `Get key from ${formData.llmProvider === 'openai' ? 'platform.openai.com' : 'console.anthropic.com'}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display Tab */}
      {activeTab === 'display' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MonitorSmartphone className="w-5 h-5 text-indigo-400" />
                Theme
              </h2>
            </div>
            <div className="card-body">
              <div className="flex gap-3">
                {[
                  { value: 'light' as const, icon: Sun, label: 'Light' },
                  { value: 'dark' as const, icon: Moon, label: 'Dark' },
                  { value: 'system' as const, icon: Monitor, label: 'System' },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setFormData({ ...formData, theme: t.value })}
                      className={`flex-1 p-4 rounded-xl border transition-all ${
                        formData.theme === t.value
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-light)]'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-medium">{t.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Default View</h2>
            </div>
            <div className="card-body">
              <select
                value={formData.defaultView}
                onChange={(e) => setFormData({ ...formData, defaultView: e.target.value as 'grid' | 'list' })}
                className="select"
              >
                <option value="grid">Grid View</option>
                <option value="list">List View</option>
              </select>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Items Per Page</h2>
            </div>
            <div className="card-body">
              <input
                type="number"
                value={formData.itemsPerPage}
                onChange={(e) => setFormData({ ...formData, itemsPerPage: parseInt(e.target.value, 10) })}
                className="input"
                min={10}
                max={100}
                style={{ maxWidth: '200px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 animate-fade-in">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                Reminder Notifications
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
                <div>
                  <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Get browser alerts for reminders</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    formData.notificationsEnabled ? 'bg-indigo-500' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    formData.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="input-group">
                <label className="label">Notify me</label>
                <select
                  value={formData.notificationTiming}
                  onChange={(e) => setFormData({ ...formData, notificationTiming: parseInt(e.target.value, 10) })}
                  className="select"
                >
                  <option value={0}>At due date</option>
                  <option value={1}>1 day before</option>
                  <option value={3}>3 days before</option>
                  <option value={7}>1 week before</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="mt-8 flex justify-end">
        <button className="btn btn-primary shadow-lg shadow-indigo-500/25" onClick={handleSave}>
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
