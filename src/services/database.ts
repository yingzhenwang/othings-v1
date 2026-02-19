import initSqlJs, { Database } from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import { Item, Category, Reminder, DEFAULT_CATEGORIES, AppSettings } from '../types';

let db: Database | null = null;
let dbHandle: FileSystemFileHandle | null = null;

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });
  db = new SQL.Database();
  createTables();
}

function createTables(): void {
  if (!db) return;

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      quantity INTEGER DEFAULT 1,
      location TEXT DEFAULT '',
      condition TEXT DEFAULT 'Good',
      uses_left INTEGER,
      total_uses INTEGER,
      purchase_date TEXT,
      purchase_price REAL,
      currency TEXT DEFAULT 'USD',
      purchase_place TEXT DEFAULT '',
      warranty_expiry TEXT,
      brand TEXT DEFAULT '',
      model TEXT DEFAULT '',
      serial_number TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      photos TEXT DEFAULT '[]',
      qr_code TEXT DEFAULT '',
      custom_fields TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'Package',
      is_custom INTEGER DEFAULT 0,
      parent_id TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      type TEXT NOT NULL,
      due_date TEXT NOT NULL,
      message TEXT DEFAULT '',
      is_completed INTEGER DEFAULT 0,
      repeat TEXT,
      FOREIGN KEY (item_id) REFERENCES items(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Insert default categories if not exists
  const result = db.exec('SELECT COUNT(*) FROM categories');
  const count = result[0]?.values[0]?.[0] as number || 0;
  if (count === 0) {
    DEFAULT_CATEGORIES.forEach(cat => {
      db!.run(
        'INSERT INTO categories (id, name, icon, is_custom, parent_id) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), cat.name, cat.icon, cat.is_custom ? 1 : 0, cat.parent_id]
      );
    });
  }
}

export function getDb(): Database | null {
  return db;
}

export function setDbFileHandle(handle: FileSystemFileHandle | null): void {
  dbHandle = handle;
}

export function getDbFileHandle(): FileSystemFileHandle | null {
  return dbHandle;
}

// Items CRUD
export function getAllItems(): Item[] {
  if (!db) return [];
  const result = db.exec('SELECT * FROM items ORDER BY created_at DESC');
  if (!result[0]) return [];

  return result[0].values.map(row => rowToItem(row, result[0].columns));
}

export function getItemById(id: string): Item | null {
  if (!db) return null;
  const stmt = db.prepare('SELECT * FROM items WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.get();
    const columns = stmt.getColumnNames();
    stmt.free();
    return rowToItem(row, columns);
  }
  stmt.free();
  return null;
}

export function createItem(item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Item {
  if (!db) throw new Error('Database not initialized');

  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(`
    INSERT INTO items (
      id, name, description, category, tags, quantity, location, condition,
      uses_left, total_uses, purchase_date, purchase_price, currency,
      purchase_place, warranty_expiry, brand, model, serial_number,
      notes, photos, qr_code, custom_fields, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    item.name || '',
    item.description || '',
    item.category || '',
    JSON.stringify(item.tags || []),
    item.quantity ?? 1,
    item.location || '',
    item.condition || 'Good',
    item.uses_left ?? null,
    item.total_uses ?? null,
    item.purchase_date ?? null,
    item.purchase_price ?? null,
    item.currency || 'USD',
    item.purchase_place || '',
    item.warranty_expiry ?? null,
    item.brand || '',
    item.model || '',
    item.serial_number || '',
    item.notes || '',
    JSON.stringify(item.photos || []),
    item.qr_code || '',
    JSON.stringify(item.custom_fields || {}),
    now,
    now
  ]);

  return getItemById(id)!;
}

export function updateItem(id: string, item: Partial<Item>): Item | null {
  if (!db) return null;

  const existing = getItemById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated = { ...existing, ...item, updated_at: now };

  db.run(`
    UPDATE items SET
      name = ?, description = ?, category = ?, tags = ?, quantity = ?,
      location = ?, condition = ?, uses_left = ?, total_uses = ?,
      purchase_date = ?, purchase_price = ?, currency = ?, purchase_place = ?,
      warranty_expiry = ?, brand = ?, model = ?, serial_number = ?,
      notes = ?, photos = ?, qr_code = ?, custom_fields = ?, updated_at = ?
    WHERE id = ?
  `, [
    updated.name ?? '',
    updated.description ?? '',
    updated.category ?? '',
    JSON.stringify(updated.tags ?? []),
    updated.quantity ?? 1,
    updated.location ?? '',
    updated.condition ?? 'Good',
    updated.uses_left ?? null,
    updated.total_uses ?? null,
    updated.purchase_date ?? null,
    updated.purchase_price ?? null,
    updated.currency ?? 'USD',
    updated.purchase_place ?? '',
    updated.warranty_expiry ?? null,
    updated.brand ?? '',
    updated.model ?? '',
    updated.serial_number ?? '',
    updated.notes ?? '',
    JSON.stringify(updated.photos ?? []),
    updated.qr_code ?? '',
    JSON.stringify(updated.custom_fields ?? {}),
    now,
    id
  ]);

  return getItemById(id);
}

export function deleteItem(id: string): boolean {
  if (!db) return false;
  db.run('DELETE FROM items WHERE id = ?', [id]);
  db.run('DELETE FROM reminders WHERE item_id = ?', [id]);
  return true;
}

// Categories CRUD
export function getAllCategories(): Category[] {
  if (!db) return [];
  const result = db.exec('SELECT * FROM categories ORDER BY is_custom, name');
  if (!result[0]) return [];

  return result[0].values.map(row => rowToCategory(row, result[0].columns));
}

export function createCategory(name: string, icon: string, parentId?: string): Category {
  if (!db) throw new Error('Database not initialized');

  const id = uuidv4();
  db.run(
    'INSERT INTO categories (id, name, icon, is_custom, parent_id) VALUES (?, ?, ?, 1, ?)',
    [id, name, icon, parentId || null]
  );

  const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    throw new Error('Failed to create category');
  }
  const row = stmt.get();
  const columns = stmt.getColumnNames();
  stmt.free();

  return rowToCategory(row, columns);
}

export function updateCategory(id: string, name: string, icon: string): boolean {
  if (!db) return false;
  db.run('UPDATE categories SET name = ?, icon = ? WHERE id = ?', [name, icon, id]);
  return true;
}

export function deleteCategory(id: string): boolean {
  if (!db) return false;

  // Don't delete system categories
  const stmt = db.prepare('SELECT is_custom FROM categories WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const isCustom = stmt.get()[0] === 1;
    stmt.free();
    if (!isCustom) return false;
  } else {
    stmt.free();
    return false;
  }

  db.run('DELETE FROM categories WHERE id = ?', [id]);
  return true;
}

// Reminders CRUD
export function getAllReminders(): Reminder[] {
  if (!db) return [];
  const result = db.exec('SELECT * FROM reminders ORDER BY due_date');
  if (!result[0]) return [];

  return result[0].values.map(row => rowToReminder(row, result[0].columns));
}

export function getRemindersForItem(itemId: string): Reminder[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM reminders WHERE item_id = ? ORDER BY due_date');
  stmt.bind([itemId]);

  const reminders: Reminder[] = [];
  while (stmt.step()) {
    reminders.push(rowToReminder(stmt.get(), stmt.getColumnNames()));
  }
  stmt.free();
  return reminders;
}

export function createReminder(reminder: Omit<Reminder, 'id'>): Reminder {
  if (!db) throw new Error('Database not initialized');

  const id = uuidv4();
  db.run(`
    INSERT INTO reminders (id, item_id, type, due_date, message, is_completed, repeat)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    reminder.item_id,
    reminder.type,
    reminder.due_date,
    reminder.message || '',
    reminder.is_completed ? 1 : 0,
    reminder.repeat
  ]);

  const stmt = db.prepare('SELECT * FROM reminders WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  const row = stmt.get();
  const columns = stmt.getColumnNames();
  stmt.free();

  return rowToReminder(row, columns);
}

export function updateReminder(id: string, reminder: Partial<Reminder>): Reminder | null {
  if (!db) return null;

  const stmt = db.prepare('SELECT * FROM reminders WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const existing = rowToReminder(stmt.get(), stmt.getColumnNames());
  stmt.free();

  const updated = { ...existing, ...reminder };
  db.run(`
    UPDATE reminders SET
      item_id = ?, type = ?, due_date = ?, message = ?, is_completed = ?, repeat = ?
    WHERE id = ?
  `, [
    updated.item_id,
    updated.type,
    updated.due_date,
    updated.message,
    updated.is_completed ? 1 : 0,
    updated.repeat,
    id
  ]);

  const resultStmt = db.prepare('SELECT * FROM reminders WHERE id = ?');
  resultStmt.bind([id]);
  resultStmt.step();
  const row = resultStmt.get();
  const columns = resultStmt.getColumnNames();
  resultStmt.free();

  return rowToReminder(row, columns);
}

export function deleteReminder(id: string): boolean {
  if (!db) return false;
  db.run('DELETE FROM reminders WHERE id = ?', [id]);
  return true;
}

// Settings
export function getSetting(key: string): string | null {
  if (!db) return null;
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  stmt.bind([key]);
  if (stmt.step()) {
    const value = stmt.get()[0] as string;
    stmt.free();
    return value;
  }
  stmt.free();
  return null;
}

export function setSetting(key: string, value: string): void {
  if (!db) return;
  db.run(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export function getSettings(): Partial<AppSettings> {
  const settings: Partial<AppSettings> = {};
  const keys: (keyof AppSettings)[] = [
    'theme', 'defaultView', 'itemsPerPage', 'searchMode',
    'llmProvider', 'llmApiKey', 'notificationsEnabled', 'notificationTiming', 'dataFilePath'
  ];

  keys.forEach(key => {
    const value = getSetting(key);
    if (value !== null) {
      (settings as any)[key] = key === 'itemsPerPage' || key === 'notificationTiming'
        ? parseInt(value, 10)
        : value;
    }
  });

  return settings;
}

export function saveSettings(settings: Partial<AppSettings>): void {
  Object.entries(settings).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      setSetting(key, String(value));
    }
  });
}

// Database file operations
export async function exportDbToArrayBuffer(): Promise<Uint8Array> {
  if (!db) throw new Error('Database not initialized');
  return db.export();
}

export async function saveDatabaseToFile(handle: FileSystemFileHandle): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const data = db.export();
  const writable = await handle.createWritable();
  await writable.write(data as unknown as Blob | BufferSource);
  await writable.close();
  dbHandle = handle;
}

export async function loadDatabaseFromFile(handle: FileSystemFileHandle): Promise<void> {
  const file = await handle.getFile();
  const arrayBuffer = await file.arrayBuffer();

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });

  db = new SQL.Database(new Uint8Array(arrayBuffer));
  dbHandle = handle;
  createTables();
}

// Helper functions to convert row to type
function rowToItem(row: (string | number | null)[], columns: string[]): Item {
  const obj: Record<string, string | number | null> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });

  return {
    id: String(obj.id),
    name: String(obj.name ?? ''),
    description: String(obj.description ?? ''),
    category: String(obj.category ?? ''),
    tags: JSON.parse(String(obj.tags ?? '[]')),
    quantity: Number(obj.quantity ?? 1),
    location: String(obj.location ?? ''),
    condition: String(obj.condition ?? 'Good') as Item['condition'],
    uses_left: obj.uses_left != null ? Number(obj.uses_left) : null,
    total_uses: obj.total_uses != null ? Number(obj.total_uses) : null,
    purchase_date: obj.purchase_date != null ? String(obj.purchase_date) : null,
    purchase_price: obj.purchase_price != null ? Number(obj.purchase_price) : null,
    currency: String(obj.currency ?? 'USD'),
    purchase_place: String(obj.purchase_place ?? ''),
    warranty_expiry: obj.warranty_expiry != null ? String(obj.warranty_expiry) : null,
    brand: String(obj.brand ?? ''),
    model: String(obj.model ?? ''),
    serial_number: String(obj.serial_number ?? ''),
    notes: String(obj.notes ?? ''),
    photos: JSON.parse(String(obj.photos ?? '[]')),
    qr_code: String(obj.qr_code ?? ''),
    custom_fields: JSON.parse(String(obj.custom_fields ?? '{}')),
    created_at: String(obj.created_at),
    updated_at: String(obj.updated_at),
  };
}

function rowToCategory(row: (string | number | null)[], columns: string[]): Category {
  const obj: Record<string, string | number | null> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });

  return {
    id: String(obj.id),
    name: String(obj.name ?? ''),
    icon: String(obj.icon ?? 'Package'),
    is_custom: obj.is_custom === 1,
    parent_id: obj.parent_id != null ? String(obj.parent_id) : null,
  };
}

function rowToReminder(row: (string | number | null)[], columns: string[]): Reminder {
  const obj: Record<string, string | number | null> = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });

  return {
    id: String(obj.id),
    item_id: String(obj.item_id),
    type: String(obj.type) as Reminder['type'],
    due_date: String(obj.due_date),
    message: String(obj.message ?? ''),
    is_completed: obj.is_completed === 1,
    repeat: obj.repeat != null ? String(obj.repeat) : null,
  };
}

// Statistics
export function getItemCount(): number {
  if (!db) return 0;
  const result = db.exec('SELECT COUNT(*) FROM items');
  return (result[0]?.values[0]?.[0] as number) || 0;
}

export function getTotalValue(): number {
  if (!db) return 0;
  const result = db.exec('SELECT SUM(purchase_price * quantity) FROM items WHERE purchase_price IS NOT NULL');
  return (result[0]?.values[0]?.[0] as number) || 0;
}

export function getItemsByCondition(): { condition: string; count: number }[] {
  if (!db) return [];
  const result = db.exec('SELECT condition, COUNT(*) as count FROM items GROUP BY condition');
  if (!result[0]) return [];

  return result[0].values.map(row => ({
    condition: row[0] as string,
    count: row[1] as number,
  }));
}

export function getItemsByCategory(): { category: string; count: number; value: number }[] {
  if (!db) return [];
  const result = db.exec(`
    SELECT category, COUNT(*) as count, COALESCE(SUM(purchase_price * quantity), 0) as value
    FROM items GROUP BY category
  `);
  if (!result[0]) return [];

  return result[0].values.map(row => ({
    category: row[0] as string || 'Uncategorized',
    count: row[1] as number,
    value: row[2] as number,
  }));
}

export function getItemsByLocation(): { location: string; count: number }[] {
  if (!db) return [];
  const result = db.exec('SELECT location, COUNT(*) as count FROM items WHERE location != "" GROUP BY location');
  if (!result[0]) return [];

  return result[0].values.map(row => ({
    location: row[0] as string || 'Unknown',
    count: row[1] as number,
  }));
}

export function getRecentItems(limit: number = 5): Item[] {
  if (!db) return [];
  const result = db.exec(`SELECT * FROM items ORDER BY created_at DESC LIMIT ${limit}`);
  if (!result[0]) return [];

  return result[0].values.map(row => rowToItem(row, result[0].columns));
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function getItemsPaginated(page: number = 1, pageSize: number = 20): PaginatedResult<Item> {
  if (!db) {
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const countResult = db.exec('SELECT COUNT(*) FROM items');
  const total = (countResult[0]?.values[0]?.[0] as number) || 0;
  const offset = (page - 1) * pageSize;

  const result = db.exec(`SELECT * FROM items ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`);
  if (!result[0]) {
    return { data: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  return {
    data: result[0].values.map(row => rowToItem(row, result[0].columns)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function getItemsAddedThisMonth(): number {
  if (!db) return 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const result = db.exec(`SELECT COUNT(*) FROM items WHERE created_at >= '${startOfMonth}'`);
  return (result[0]?.values[0]?.[0] as number) || 0;
}

export function getUpcomingReminders(days: number = 7): Reminder[] {
  if (!db) return [];
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const result = db.exec(`
    SELECT * FROM reminders
    WHERE is_completed = 0 AND due_date <= '${futureDate}'
    ORDER BY due_date
  `);
  if (!result[0]) return [];

  return result[0].values.map(row => rowToReminder(row, result[0].columns));
}
