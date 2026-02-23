// Settings Page
import { useState, useEffect } from 'react';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { itemRepository } from '@/features/items/services/itemRepository';
import { categoryRepository } from '@/features/categories/services/categoryRepository';
import { reminderRepository } from '@/features/reminders/services/reminderRepository';

export function Settings() {
  const { settings, loading, updateSettings } = useSettings();
  const [storageMode, setStorageMode] = useState<string>('localStorage');
  const [exportStatus, setExportStatus] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('othings-filename');
    if (stored) {
      setStorageMode('file');
    }
  }, []);

  const handleSwitchToFile = async () => {
    alert('File storage: In production, this would open a file picker to select a location in iCloud Drive.');
  };

  const handleExport = () => {
    try {
      const data = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        items: itemRepository.findAll(),
        categories: categoryRepository.findAll(),
        reminders: reminderRepository.findAll()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `othings-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setExportStatus('Exported successfully!');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (e) {
      setExportStatus('Export failed: ' + String(e));
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.version) {
          alert('Invalid backup file');
          return;
        }
        
        if (confirm('This will replace all existing data. Continue?')) {
          // Import categories first
          if (data.categories) {
            for (const cat of data.categories) {
              try {
                categoryRepository.create({
                  name: cat.name,
                  color: cat.color,
                  icon: cat.icon
                });
              } catch {}
            }
          }
          
          // Import items
          if (data.items) {
            for (const item of data.items) {
              try {
                itemRepository.create({
                  name: item.name,
                  categoryId: item.categoryId,
                  quantity: item.quantity,
                  description: item.description,
                  location: item.location,
                  status: item.status,
                  purchasePrice: item.purchasePrice,
                  purchaseDate: item.purchaseDate,
                  warrantyExpiry: item.warrantyExpiry
                });
              } catch {}
            }
          }
          
          // Import reminders
          if (data.reminders) {
            for (const rem of data.reminders) {
              try {
                reminderRepository.create({
                  itemId: rem.itemId,
                  title: rem.title,
                  dueDate: rem.dueDate,
                  notifyBefore: rem.notifyBefore
                });
              } catch {}
            }
          }
          
          setExportStatus('Imported successfully! Refresh to see changes.');
          setTimeout(() => setExportStatus(''), 3000);
        }
      } catch (e) {
        setExportStatus('Import failed: ' + String(e));
      }
    };
    input.click();
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

        {/* Import/Export */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
            Backup & Restore
          </h2>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <button className="btn btn-secondary" onClick={handleExport}>
              📤 Export Data
            </button>
            <button className="btn btn-secondary" onClick={handleImport}>
              📥 Import Data
            </button>
          </div>
          
          {exportStatus && (
            <div style={{ 
              padding: '12px', 
              background: exportStatus.includes('failed') ? '#fee2e2' : '#d1fae5', 
              borderRadius: '8px',
              fontSize: '13px',
              color: exportStatus.includes('failed') ? '#c53030' : '#059669'
            }}>
              {exportStatus}
            </div>
          )}
          
          <div style={{ 
            padding: '12px', 
            background: 'var(--color-bg-secondary)', 
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            marginTop: '12px'
          }}>
            💾 Export your data as JSON for backup. Import from a previous backup to restore data.
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
