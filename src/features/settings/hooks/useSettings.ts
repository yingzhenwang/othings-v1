// Settings Hook
import { useState, useEffect } from 'react';
import { settingsRepository } from '../services/settingsRepository';
import type { Settings } from '@/shared/types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const s = settingsRepository.get();
      setSettings(s);
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    try {
      const updated = settingsRepository.save(newSettings);
      setSettings(updated);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  return { settings, loading, updateSettings };
}
