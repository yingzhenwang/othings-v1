// Settings Repository - Database operations for Settings

import { getDatabase, saveDatabase } from '../../shared/db';
import { Settings, defaultSettings } from '../../shared/types';

const SETTINGS_KEY = 'app_settings';

export class SettingsRepository {
  get(): Settings {
    const db = getDatabase();
    const results = db.exec('SELECT value FROM settings WHERE key = ?', [SETTINGS_KEY]);
    
    if (results.length === 0 || results[0].values.length === 0) {
      // Return default settings if none exist
      return { ...defaultSettings };
    }
    
    try {
      return JSON.parse(results[0].values[0][0] as string) as Settings;
    } catch {
      return { ...defaultSettings };
    }
  }
  
  save(settings: Partial<Settings>): Settings {
    const db = getDatabase();
    const current = this.get();
    const updated = { ...current, ...settings };
    
    // Delete existing and insert new
    db.run('DELETE FROM settings WHERE key = ?', [SETTINGS_KEY]);
    db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [
      SETTINGS_KEY,
      JSON.stringify(updated)
    ]);
    
    saveDatabase();
    
    return updated;
  }
  
  reset(): Settings {
    return this.save(defaultSettings);
  }
  
  // Theme helpers
  getEffectiveTheme(): 'light' | 'dark' {
    const settings = this.get();
    if (settings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme;
  }
}

export const settingsRepository = new SettingsRepository();
