// Database initialization and schema for sql.js
// Supports file-based storage (iCloud Drive) via File System Access API

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let fileHandle: FileSystemFileHandle | null = null;

const DB_VERSION = 'v1';

// Check if File System Access API is supported
const supportsFileSystemAccess = typeof window !== 'undefined' && 'showOpenFilePicker' in window;

export interface StorageMode {
  type: 'file' | 'localStorage';
  fileName?: string;
}

export function isFileStorageSupported(): boolean {
  return supportsFileSystemAccess;
}

export async function selectDatabaseFile(): Promise<FileSystemFileHandle | null> {
  if (!supportsFileSystemAccess) return null;

  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'OThings Database',
        accept: { 'application/json': ['.json'] }
      }],
      multiple: false,
      suggestedName: 'othings-data.json'
    });
    fileHandle = handle;
    // Store in localStorage for persistence
    localStorage.setItem('othings-filename', handle.name);
    console.log('[DB] File selected:', handle.name);
    return handle;
  } catch (e) {
    if ((e as Error).name === 'AbortError') return null;
    console.error('[DB] Error selecting file:', e);
    return null;
  }
}

async function loadFromFile(handle: FileSystemFileHandle): Promise<Uint8Array | null> {
  try {
    const file = await handle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.version === DB_VERSION && data.content) {
      return new Uint8Array(data.content);
    }
    return null;
  } catch (e) {
    console.error('[DB] Error reading file:', e);
    return null;
  }
}

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
    console.log('[DB] Saved to file:', handle.name);
  } catch (e) {
    console.error('[DB] Error saving to file:', e);
    throw e;
  }
}

export async function initDatabase(): Promise<Database> {
  if (db) return db;
  
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });
  
  // Try file storage first
  if (supportsFileSystemAccess) {
    const savedFilename = localStorage.getItem('othings-filename');
    if (savedFilename) {
      // For now, user needs to re-select file each session
      // Future: use File System Access API's saved handles
    }
  }
  
  // Fallback to localStorage
  const saved = localStorage.getItem('othings-db');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.version === DB_VERSION && data.content) {
        db = new SQL.Database(new Uint8Array(data.content));
        console.log('[DB] Loaded from localStorage');
        return db;
      }
    } catch (e) {
      console.warn('[DB] Failed to load:', e);
    }
  }
  
  db = new SQL.Database();
  initSchema(db);
  console.log('[DB] Created new database');
  return db;
}

export async function getStorageMode(): Promise<StorageMode> {
  if (fileHandle) {
    return { type: 'file', fileName: fileHandle.name };
  }
  return { type: 'localStorage' };
}

export async function switchToFileStorage(): Promise<boolean> {
  const handle = await selectDatabaseFile();
  if (handle && db) {
    await saveToFile(handle);
    localStorage.removeItem('othings-db');
    return true;
  }
  return false;
}

function initSchema(database: Database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#5c5f66',
      icon TEXT, parentId TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, categoryId TEXT, quantity INTEGER NOT NULL DEFAULT 1,
      description TEXT, location TEXT, status TEXT NOT NULL DEFAULT 'active',
      purchasePrice REAL, purchaseDate TEXT, warrantyExpiry TEXT, customFields TEXT,
      createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY, itemId TEXT NOT NULL, title TEXT NOT NULL, dueDate TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0, completedAt TEXT, notifyBefore INTEGER NOT NULL DEFAULT 7,
      createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
    )
  `);
  database.run(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)
  `);
  
  database.run(`CREATE INDEX IF NOT EXISTS idx_items_categoryId ON items(categoryId)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_reminders_itemId ON reminders(itemId)`);
}

export function saveDatabase(): void {
  if (!db) return;
  
  if (fileHandle) {
    saveToFile(fileHandle).catch(() => saveToLocalStorage());
  } else {
    saveToLocalStorage();
  }
}

function saveToLocalStorage(): void {
  if (!db) return;
  const data = db.export();
  localStorage.setItem('othings-db', JSON.stringify({
    version: DB_VERSION,
    content: Array.from(data)
  }));
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
export function scheduleSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => { saveDatabase(); saveTimeout = null; }, 1000);
}

export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function closeDatabase(): void {
  if (db) { saveDatabase(); db.close(); db = null; }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getTimestamp(): string {
  return new Date().toISOString();
}
