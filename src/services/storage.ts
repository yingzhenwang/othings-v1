import { setSetting, getSetting, saveDatabaseToFile, loadDatabaseFromFile, getDbFileHandle, exportDbToArrayBuffer } from './database';
import { Item, Category, Reminder } from '../types';

// File System Access API type declarations
interface FilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  multiple?: boolean;
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemFileHandle[]>;
  }
}

export async function showSaveDialog(): Promise<FileSystemFileHandle | null> {
  if (!('showSaveFilePicker' in window)) {
    console.error('File System Access API not supported');
    return null;
  }

  try {
    const handle = await window.showSaveFilePicker!({
      suggestedName: 'stuff-manager.db',
      types: [
        {
          description: 'SQLite Database',
          accept: { 'application/x-sqlite3': ['.db', '.sqlite', '.sqlite3'] },
        },
      ],
    });
    return handle;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Save dialog error:', err);
    }
    return null;
  }
}

export async function showOpenDialog(): Promise<FileSystemFileHandle | null> {
  if (!('showOpenFilePicker' in window)) {
    console.error('File System Access API not supported');
    return null;
  }

  try {
    const [handle] = await window.showOpenFilePicker!({
      types: [
        {
          description: 'SQLite Database',
          accept: { 'application/x-sqlite3': ['.db', '.sqlite', '.sqlite3'] },
        },
      ],
      multiple: false,
    });
    return handle;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Open dialog error:', err);
    }
    return null;
  }
}

export async function createNewDatabase(): Promise<boolean> {
  const handle = await showSaveDialog();
  if (!handle) return false;

  try {
    const writable = await handle.createWritable();
    await writable.close();

    await loadDatabaseFromFile(handle);
    setSetting('dataFilePath', handle.name);
    return true;
  } catch (err) {
    console.error('Create database error:', err);
    return false;
  }
}

export async function openDatabase(): Promise<boolean> {
  const handle = await showOpenDialog();
  if (!handle) return false;

  try {
    await loadDatabaseFromFile(handle);
    setSetting('dataFilePath', handle.name);
    return true;
  } catch (err) {
    console.error('Open database error:', err);
    return false;
  }
}

export async function saveDatabase(): Promise<boolean> {
  const handle = getDbFileHandle();
  if (!handle) {
    return await saveDatabaseAs();
  }

  try {
    await saveDatabaseToFile(handle);
    return true;
  } catch (err) {
    console.error('Save database error:', err);
    return false;
  }
}

export async function saveDatabaseAs(): Promise<boolean> {
  const handle = await showSaveDialog();
  if (!handle) return false;

  try {
    await saveDatabaseToFile(handle);
    setSetting('dataFilePath', handle.name);
    return true;
  } catch (err) {
    console.error('Save database as error:', err);
    return false;
  }
}

export async function exportToJSON(): Promise<boolean> {
  if (!('showSaveFilePicker' in window)) {
    console.error('File System Access API not supported');
    return false;
  }

  try {
    const handle = await window.showSaveFilePicker!({
      suggestedName: 'stuff-manager-export.json',
      types: [
        {
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });

    const { getAllItems, getAllCategories, getAllReminders, getSettings } = await import('./database');

    const exportData = {
      items: getAllItems(),
      categories: getAllCategories(),
      reminders: getAllReminders(),
      settings: getSettings(),
      exportedAt: new Date().toISOString(),
    };

    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(exportData, null, 2));
    await writable.close();

    return true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Export JSON error:', err);
    }
    return false;
  }
}

export async function exportToCSV(): Promise<boolean> {
  if (!('showSaveFilePicker' in window)) {
    console.error('File System Access API not supported');
    return false;
  }

  try {
    const handle = await window.showSaveFilePicker!({
      suggestedName: 'stuff-manager-export.csv',
      types: [
        {
          description: 'CSV File',
          accept: { 'text/csv': ['.csv'] },
        },
      ],
    });

    const { getAllItems } = await import('./database');
    const items = getAllItems();

    const headers = [
      'Name', 'Description', 'Category', 'Tags', 'Quantity', 'Location',
      'Condition', 'Uses Left', 'Total Uses', 'Purchase Date', 'Purchase Price',
      'Currency', 'Purchase Place', 'Warranty Expiry', 'Brand', 'Model',
      'Serial Number', 'Notes', 'QR Code', 'Created At', 'Updated At'
    ];

    const rows = items.map(item => [
      escapeCSV(item.name),
      escapeCSV(item.description),
      escapeCSV(item.category),
      escapeCSV(item.tags.join('; ')),
      item.quantity.toString(),
      escapeCSV(item.location),
      item.condition,
      item.uses_left?.toString() || '',
      item.total_uses?.toString() || '',
      item.purchase_date || '',
      item.purchase_price?.toString() || '',
      item.currency,
      escapeCSV(item.purchase_place),
      item.warranty_expiry || '',
      escapeCSV(item.brand),
      escapeCSV(item.model),
      escapeCSV(item.serial_number),
      escapeCSV(item.notes),
      escapeCSV(item.qr_code),
      item.created_at,
      item.updated_at,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const writable = await handle.createWritable();
    await writable.write(csv);
    await writable.close();

    return true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Export CSV error:', err);
    }
    return false;
  }
}

function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function importFromJSON(): Promise<boolean> {
  if (!('showOpenFilePicker' in window)) {
    console.error('File System Access API not supported');
    return false;
  }

  try {
    const [handle] = await window.showOpenFilePicker!({
      types: [
        {
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        },
      ],
      multiple: false,
    });

    const file = await handle.getFile();
    const text = await file.text();
    const data = JSON.parse(text) as {
      items?: Partial<Item>[];
      categories?: Category[];
      reminders?: Reminder[];
    };

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid JSON format');
    }

    const { createItem, createCategory, createReminder } = await import('./database');

    // Import categories first
    if (data.categories) {
      data.categories.forEach((cat: Category) => {
        if (cat.is_custom) {
          createCategory(cat.name, cat.icon, cat.parent_id ?? undefined);
        }
      });
    }

    // Import items
    data.items.forEach((item: Partial<Item>) => {
      createItem({
        name: item.name ?? '',
        description: item.description ?? '',
        category: item.category ?? '',
        tags: item.tags ?? [],
        quantity: item.quantity ?? 1,
        location: item.location ?? '',
        condition: item.condition ?? 'Good',
        uses_left: item.uses_left ?? null,
        total_uses: item.total_uses ?? null,
        purchase_date: item.purchase_date ?? null,
        purchase_price: item.purchase_price ?? null,
        currency: item.currency ?? 'USD',
        purchase_place: item.purchase_place ?? '',
        warranty_expiry: item.warranty_expiry ?? null,
        brand: item.brand ?? '',
        model: item.model ?? '',
        serial_number: item.serial_number ?? '',
        notes: item.notes ?? '',
        photos: item.photos ?? [],
        qr_code: item.qr_code ?? '',
        custom_fields: item.custom_fields ?? {},
      });
    });

    // Import reminders
    if (data.reminders) {
      data.reminders.forEach((reminder: Reminder) => {
        createReminder({
          item_id: reminder.item_id,
          type: reminder.type,
          due_date: reminder.due_date,
          message: reminder.message ?? '',
          is_completed: reminder.is_completed ?? false,
          repeat: reminder.repeat ?? null,
        });
      });
    }

    return true;
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      console.error('Import JSON error:', err);
    }
    return false;
  }
}

export function isFileSystemAccessSupported(): boolean {
  return 'showSaveFilePicker' in window;
}
