// Keyboard shortcuts hook
import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    { key: '1', action: () => navigate('/'), description: 'Go to Dashboard' },
    { key: '2', action: () => navigate('/items'), description: 'Go to Items' },
    { key: '3', action: () => navigate('/categories'), description: 'Go to Categories' },
    { key: '4', action: () => navigate('/reminders'), description: 'Go to Reminders' },
    { key: '5', action: () => navigate('/settings'), description: 'Go to Settings' },
    { key: '?', shift: true, action: () => setShowHelp(true), description: 'Show keyboard shortcuts' },
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const shortcut = shortcuts.find(s => 
      s.key.toLowerCase() === e.key.toLowerCase() && 
      Boolean(s.ctrl) === (e.ctrlKey || e.metaKey) &&
      Boolean(s.shift) === e.shiftKey
    );

    if (shortcut) {
      e.preventDefault();
      shortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts, showHelp, setShowHelp };
}

// Keyboard shortcuts help modal component
export function ShortcutsModal({ shortcuts, onClose }: { 
  shortcuts: Shortcut[], 
  onClose: () => void 
}) {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '90vw',
          boxShadow: 'var(--shadow-xl)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>⌨️ Keyboard Shortcuts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shortcuts.map((s, i) => (
            <div 
              key={i}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: i < shortcuts.length - 1 ? '1px solid var(--color-border)' : 'none'
              }}
            >
              <span style={{ color: 'var(--color-text-secondary)' }}>{s.description}</span>
              <kbd style={{
                background: 'var(--color-bg-tertiary)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {s.shift && '⇧'}{s.ctrl && '⌘'}{s.key}
              </kbd>
            </div>
          ))}
        </div>
        <button 
          onClick={onClose}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px',
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
