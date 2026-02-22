import { useState, useEffect } from 'react';
import { initDatabase, getStorageMode, switchToFileStorage, isFileStorageSupported, type StorageMode } from '@/shared/db';

export function useStorageMode() {
  const [mode, setMode] = useState<StorageMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDatabase().then(() => {
      getStorageMode().then(m => {
        setMode(m);
        setLoading(false);
      });
    });
  }, []);

  const switchToFile = async (): Promise<boolean> => {
    const success = await switchToFileStorage();
    if (success) {
      const newMode = await getStorageMode();
      setMode(newMode);
    }
    return success;
  };

  return {
    mode,
    loading,
    isFileSupported: isFileStorageSupported(),
    switchToFile
  };
}
