// Database initialization and schema for sql.js
// Supports file-based storage (iCloud Drive) via File System Access API

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let fileHandle: FileSystemFileHandle | null = null;

const DB_VERSION = 'v1';
const FILE_HANDLE_KEY = 'othings-file-handle';

// Check if File System Access API is supported
const supportsFileSystemAccess = 'showOpenFilePicker' in window;

export interface StorageMode {
  type: 'file' | 'localStorage';
  fileName?: string;
}

/**
 * Check if File System Access API is available
 */
export function isFileStorageSupported(): boolean {
  return supportsFileSystemAccess;
}

/**
 * Open file picker and let user select a database file
 * File should be stored in iCloud Drive for cross-device access
 */
export async function selectDatabaseFile(): Promise<FileSystemFileHandle | null> {
  if (!supportsFileSystemAccess) {
    console.warn('[DB] File System Access API not supported');
    return null;
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'OThings Database',
          accept: { 'application/json': ['.json'] }
        }
      ],
      multiple: false,
      suggestedName: 'othings-data.json'
    });

    // Store handle reference for future sessions
    await storeFileHandle(handle);
    fileHandle = handle;
    
    console.log('[DB] File selected:', handle.name);
    return handle;
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      console.log('[DB] File selection cancelled');
      return null;
    }
    console.error('[DB] Error selecting file:', e);
    return null;
  }
}

/**
 * Store file handle in IndexedDB for persistence
 */
async function storeFileHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const handleStore = await getHandleStore();
    await handleStore.put({ key: FILE_HANDLE_KEY, handle });
    console.log('[DB] File handle stored');
  } catch (e) {
    console.warn('[DB] Could not store file handle:', e);
  }
}

/**
 * Get stored file handle from IndexedDB
 */
async function getStoredFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const handleStore = await getHandleStore();
    const result = await handleStore.get(FILE_HANDLE_KEY);
    if (result && result.handle) {
      // Check if we still have permission
      const opts: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' };
      try {
        const permission = await result.handle.queryPermission(opts);
        if (permission === 'granted') {
          return result.handle;
        }
        // Try to request permission
        const newPermission = await result.handle.requestPermission(opts);
        if (newPermission === 'granted') {
          return result.handle;
        }
      } catch {
        // Handle doesn't exist anymore, remove from storage
        await handleStore.delete(FILE_HANDLE_KEY);
      }
    }
  } catch (e) {
    console.warn('[DB] Could not get stored file handle:', e);
  }
  return null;
}

/**
 * Get IndexedDB database for storing file handles
 */
function getHandleStore(): Promise<IDBObjectStore> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OThingsHandles', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_HANDLE_KEY)) {
        db.createObjectStore(FILE_HANDLE_KEY, { keyPath: 'key' });
      }
      const tx = db.transaction(FILE_HANDLE_KEY, 'readwrite');
      resolve(tx.objectStore(FILE_HANDLE_KEY));
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_HANDLE_KEY)) {
        db.createObjectStore(FILE_HANDLE_KEY, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Read database from file
 */
async function loadFromFile(handle: FileSystemFileHandle): Promise<Uint8Array | null> {
  try {
    const file = await handle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (data.version === DB_VERSION && data.content) {
      return new Uint8Array(data.content);
    }
    console.warn('[DB] Invalid file format or version');
    return null;
  } catch (e) {
    console.error('[DB] Error reading file:', e);
    return null;
  }
}

/**
 * Save database to file
 */
async function saveToFile(handle: FileSystemFileHandle): Promise<void> {
  if (!db) return;
  
  try {
    const writable = await handle.createWritable();
    const data = db.export();
    const storageData = {
      version: DB_VERSION,
      content: Array.from(data),
      savedAt: new Date().toISOString()
    };
    await writable.write(JSON.stringify(storageData, null, 2));
    await writable.close();
    console.log('[DB] Database saved to file:', handle.name);
  } catch (e) {
    console.error('[DB] Error saving to file:', e);
    throw e;
  }
}

/**
 * Initialize database
 * Priority: File (iCloud) -> localStorage fallback
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db;
  
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });
  
  // Try to load from file first
  if (supportsFileSystemAccess) {
    const storedHandle = await getStoredFileHandle();
    if (storedHandle) {
      fileHandle = storedHandle;
      const fileData = await loadFromFile(storedHandle);
      if (fileData) {
        db = new SQL.Database(fileData);
        console.log('[DB] Loaded from file:', storedHandle.name);
        return db;
      }
    }
  }
  
  // Fallback to localStorage
  const localStorageKey = 'othings-db';
  const saved = localStorage.getItem(localStorageKey);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.version === DB_VERSION && data.content) {
        db = new SQL.Database(new Uint8Array(data.content));
        console.log('[DB] Loaded from localStorage');
        return db;
      }
    } catch (e) {
      console.warn('[DB] Failed to load from localStorage:', e);
    }
  }
  
  // Create new database
  db = new SQL.Database();
  initSchema(db);
  console.log('[DB] Created new database');
  
  return db;
}

/**
 * Get current storage mode
 */
export async function getStorageMode(): Promise<StorageMode> {
  if (fileHandle) {
    return { type: 'file', fileName: fileHandle.name };
  }
  return { type: 'localStorage' };
}

/**
 * Switch to file storage
 */
export async function switchToFileStorage(): Promise<boolean> {
  const handle = await selectDatabaseFile();
  if (handle && db) {
    await saveToFile(handle);
    // Clear localStorage
    localStorage.removeItem('othings-db');
    return true;
  }
  return false;
}

function initSchema(database: Database) {
  // Categories table
  database.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#5c5f66',
      icon TEXT,
      parentId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (parentId) REFERENCES categories(id)
    )
  `);
  
  // Items table
  database.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      categoryId TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      purchasePrice REAL,
      purchaseDate TEXT,
      warrantyExpiry TEXT,
      customFields TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    )
  `);
  
  // Reminders table
  database.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      title TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completedAt TEXT,
      notifyBefore INTEGER NOT NULL DEFAULT 7,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
    )
  `);
  
  // Settings table (JSON stored as text)
  database.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  
  // Create indexes
  database.run(`CREATE INDEX IF NOT EXISTS idx_items_categoryId ON items(categoryId)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_items_name ON items(name)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_reminders_itemId ON reminders(itemId)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_reminders_dueDate ON reminders(dueDate)`);
  
  console.log('[DB] Schema initialized');
}

/**
 * Save database - auto-detect storage mode
 */
export function saveDatabase(): void {
  if (!db) return;
  
  // If using file storage, save to file
  if (fileHandle) {
    saveToFile(fileHandle).catch(e => {
      console.error('[DB] Failed to save to file:', e);
      // Fallback to localStorage
      saveToLocalStorage();
    });
  } else {
    saveToLocalStorage();
  }
}

/**
 * Save to localStorage (fallback)
 */
function saveToLocalStorage(): void {
  if (!db) return;
  
  const data = db.export();
  const storageData = {
    version: DB_VERSION,
    content: Array.from(data)
  };
  localStorage.setItem('othings-db', JSON.stringify(storageData));
  console.log('[DB] Saved to localStorage');
}

/**
 * Schedule save (debounced)
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
export function scheduleSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveDatabase();
    saveTimeout = null;
  }, 1000);
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('[DB] Database closed');
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getTimestamp(): string {
  return new Date().toISOString();
}
