// Database initialization and schema for sql.js

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const DB_STORAGE_KEY = 'othings-db';
const DB_VERSION = 'v1';

export async function initDatabase(): Promise<Database> {
  if (db) return db;
  
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });
  
  // Try to load existing database from localStorage
  const saved = localStorage.getItem(DB_STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.version === DB_VERSION && data.content) {
        db = new SQL.Database(new Uint8Array(data.content));
        console.log('[DB] Loaded existing database');
      } else {
        throw new Error('Invalid database version');
      }
    } catch (e) {
      console.warn('[DB] Failed to load saved database, creating new one:', e);
      db = new SQL.Database();
      initSchema(db);
    }
  } else {
    db = new SQL.Database();
    initSchema(db);
    console.log('[DB] Created new database');
  }
  
  return db;
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
  
  // Create indexes for better performance
  database.run(`CREATE INDEX IF NOT EXISTS idx_items_categoryId ON items(categoryId)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_items_name ON items(name)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_reminders_itemId ON reminders(itemId)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_reminders_dueDate ON reminders(dueDate)`);
  
  console.log('[DB] Schema initialized');
}

export function saveDatabase(): void {
  if (!db) return;
  
  const data = db.export();
  const storageData = {
    version: DB_VERSION,
    content: Array.from(data)
  };
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(storageData));
  console.log('[DB] Database saved to localStorage');
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

// Utility function to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Utility function to get current timestamp
export function getTimestamp(): string {
  return new Date().toISOString();
}
