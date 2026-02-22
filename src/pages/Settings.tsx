// Settings Page
import { useState, useEffect } from 'react';
import { useSettings } from '@/features/settings/hooks/useSettings';

export function Settings() {
  const { settings, loading, updateSettings } = useSettings();
  const [storageMode, setStorageMode] = useState<string>('localStorage');

  useEffect(() => {
    // Check storage mode
    const stored = localStorage.getItem('othings-filename');
    if (stored) {
      setStorageMode('file');
    }
  }, []);

  const handleSwitchToFile = async () => {
    alert('File storage: In production, this would open a file picker to select a location in iCloud Drive.');
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* Storage */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
            Data Storage
          </h2>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Storage Method</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {storageMode === 'file' ? 'File (iCloud Drive)' : 'Browser Local Storage'}
                </div>
              </div>
              {storageMode === 'localStorage' && (
                <button className="btn btn-secondary" onClick={handleSwitchToFile}>
                  Switch to iCloud
                </button>
              )}
            </div>
          </div>

          <div style={{ 
            padding: '12px', 
            background: 'var(--color-bg-secondary)', 
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--color-text-secondary)'
          }}>
            💡 For cross-device sync, store the data file in iCloud Drive.
          </div>
        </section>

        {/* Appearance */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
            Appearance
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Theme</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Current: {settings?.theme || 'system'}
              </div>
            </div>
            <select
              value={settings?.theme || 'system'}
              onChange={e => updateSettings({ theme: e.target.value as any })}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text)'
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
            About
          </h2>
          
          <div style={{ padding: '12px 0' }}>
            <div style={{ fontWeight: 500 }}>OThings</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Version 1.0.0
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              A local-first personal item management app
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
