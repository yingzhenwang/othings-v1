// Item Repository - Database operations for Items

import { getDatabase, generateId, getTimestamp, saveDatabase } from '../db';
import { 
  Item, 
  ItemFilters, 
  CreateItemInput, 
  UpdateItemInput,
  ItemStatus 
} from '../types';

export class ItemRepository {
  findAll(filters?: ItemFilters): Item[] {
    const db = getDatabase();
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params: (string | number)[] = [];
    
    if (filters?.search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR location LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (filters?.categoryId !== undefined && filters.categoryId !== null) {
      sql += ' AND categoryId = ?';
      params.push(filters.categoryId);
    }
    
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters?.location) {
      sql += ' AND location = ?';
      params.push(filters.location);
    }
    
    sql += ' ORDER BY updatedAt DESC';
    
    const results = db.exec(sql, params);
    if (results.length === 0) return [];
    
    return results[0].values.map(row => this.mapRowToItem(row, results[0].columns));
  }
  
  findById(id: string): Item | null {
    const db = getDatabase();
    const results = db.exec('SELECT * FROM items WHERE id = ?', [id]);
    
    if (results.length === 0 || results[0].values.length === 0) return null;
    
    return this.mapRowToItem(results[0].values[0], results[0].columns);
  }
  
  create(input: CreateItemInput): Item {
    const db = getDatabase();
    const id = generateId();
    const now = getTimestamp();
    
    db.run(`
      INSERT INTO items (id, name, categoryId, quantity, description, location, status, purchasePrice, purchaseDate, warrantyExpiry, customFields, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.name,
      input.categoryId ?? null,
      input.quantity ?? 1,
      input.description ?? null,
      input.location ?? null,
      input.status ?? 'active',
      input.purchasePrice ?? null,
      input.purchaseDate ?? null,
      input.warrantyExpiry ?? null,
      input.customFields ? JSON.stringify(input.customFields) : null,
      now,
      now
    ]);
    
    saveDatabase();
    
    return this.findById(id)!;
  }
  
  update(input: UpdateItemInput): Item {
    const db = getDatabase();
    const existing = this.findById(input.id);
    if (!existing) {
      throw new Error(`Item not found: ${input.id}`);
    }
    
    const now = getTimestamp();
    const updates: string[] = [];
    const params: (string | number | null)[] = [];
    
    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.categoryId !== undefined) {
      updates.push('categoryId = ?');
      params.push(input.categoryId);
    }
    if (input.quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(input.quantity);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description ?? null);
    }
    if (input.location !== undefined) {
      updates.push('location = ?');
      params.push(input.location ?? null);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }
    if (input.purchasePrice !== undefined) {
      updates.push('purchasePrice = ?');
      params.push(input.purchasePrice ?? null);
    }
    if (input.purchaseDate !== undefined) {
      updates.push('purchaseDate = ?');
      params.push(input.purchaseDate ?? null);
    }
    if (input.warrantyExpiry !== undefined) {
      updates.push('warrantyExpiry = ?');
      params.push(input.warrantyExpiry ?? null);
    }
    if (input.customFields !== undefined) {
      updates.push('customFields = ?');
      params.push(input.customFields ? JSON.stringify(input.customFields) : null);
    }
    
    updates.push('updatedAt = ?');
    params.push(now);
    params.push(input.id);
    
    db.run(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDatabase();
    
    return this.findById(input.id)!;
  }
  
  delete(id: string): void {
    const db = getDatabase();
    db.run('DELETE FROM items WHERE id = ?', [id]);
    saveDatabase();
  }
  
  count(filters?: ItemFilters): number {
    const db = getDatabase();
    let sql = 'SELECT COUNT(*) as count FROM items WHERE 1=1';
    const params: (string | number)[] = [];
    
    if (filters?.search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR location LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (filters?.categoryId !== undefined && filters.categoryId !== null) {
      sql += ' AND categoryId = ?';
      params.push(filters.categoryId);
    }
    
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    
    const results = db.exec(sql, params);
    return results[0]?.values[0]?.[0] as number ?? 0;
  }
  
  getTotalQuantity(): number {
    const db = getDatabase();
    const results = db.exec('SELECT SUM(quantity) as total FROM items');
    return (results[0]?.values[0]?.[0] as number) ?? 0;
  }
  
  getTotalValue(): number {
    const db = getDatabase();
    const results = db.exec('SELECT SUM(quantity * purchasePrice) as total FROM items WHERE purchasePrice IS NOT NULL');
    return (results[0]?.values[0]?.[0] as number) ?? 0;
  }
  
  getCountThisMonth(): number {
    const db = getDatabase();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    const results = db.exec('SELECT COUNT(*) as count FROM items WHERE createdAt >= ?', [startOfMonth]);
    return results[0]?.values[0]?.[0] as number ?? 0;
  }
  
  getLocations(): string[] {
    const db = getDatabase();
    const results = db.exec('SELECT DISTINCT location FROM items WHERE location IS NOT NULL AND location != "" ORDER BY location');
    return results[0]?.values.map(row => row[0] as string) ?? [];
  }
  
  private mapRowToItem(row: unknown[], columns: string[]): Item {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    
    return {
      id: obj.id as string,
      name: obj.name as string,
      categoryId: obj.categoryId as string | null,
      quantity: obj.quantity as number,
      description: obj.description as string | undefined,
      location: obj.location as string | undefined,
      status: (obj.status ?? 'active') as ItemStatus,
      purchasePrice: obj.purchasePrice as number | undefined,
      purchaseDate: obj.purchaseDate as string | undefined,
      warrantyExpiry: obj.warrantyExpiry as string | undefined,
      customFields: obj.customFields ? JSON.parse(obj.customFields as string) : undefined,
      createdAt: obj.createdAt as string,
      updatedAt: obj.updatedAt as string,
    };
  }
}

export const itemRepository = new ItemRepository();
