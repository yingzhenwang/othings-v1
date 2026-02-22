// Category Repository - Database operations for Categories

import { getDatabase, generateId, getTimestamp, saveDatabase } from '../../shared/db';
import { Category, CreateCategoryInput } from '../../shared/types';

export class CategoryRepository {
  findAll(): Category[] {
    const db = getDatabase();
    const results = db.exec('SELECT * FROM categories ORDER BY name');
    if (results.length === 0) return [];
    
    return results[0].values.map(row => this.mapRowToCategory(row, results[0].columns));
  }
  
  findById(id: string): Category | null {
    const db = getDatabase();
    const results = db.exec('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (results.length === 0 || results[0].values.length === 0) return null;
    
    return this.mapRowToCategory(results[0].values[0], results[0].columns);
  }
  
  create(input: CreateCategoryInput): Category {
    const db = getDatabase();
    const id = generateId();
    const now = getTimestamp();
    
    db.run(`
      INSERT INTO categories (id, name, color, icon, parentId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.name,
      input.color,
      input.icon ?? null,
      input.parentId ?? null,
      now,
      now
    ]);
    
    saveDatabase();
    
    return this.findById(id)!;
  }
  
  update(id: string, input: Partial<CreateCategoryInput>): Category {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Category not found: ${id}`);
    }
    
    const now = getTimestamp();
    const updates: string[] = [];
    const params: (string | null)[] = [];
    
    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.color !== undefined) {
      updates.push('color = ?');
      params.push(input.color);
    }
    if (input.icon !== undefined) {
      updates.push('icon = ?');
      params.push(input.icon ?? null);
    }
    if (input.parentId !== undefined) {
      updates.push('parentId = ?');
      params.push(input.parentId ?? null);
    }
    
    updates.push('updatedAt = ?');
    params.push(now);
    params.push(id);
    
    db.run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDatabase();
    
    return this.findById(id)!;
  }
  
  delete(id: string): void {
    const db = getDatabase();
    // Set categoryId to null for items using this category
    db.run('UPDATE items SET categoryId = NULL WHERE categoryId = ?', [id]);
    // Delete child categories
    db.run('UPDATE categories SET parentId = NULL WHERE parentId = ?', [id]);
    // Delete the category
    db.run('DELETE FROM categories WHERE id = ?', [id]);
    saveDatabase();
  }
  
  count(): number {
    const db = getDatabase();
    const results = db.exec('SELECT COUNT(*) as count FROM categories');
    return results[0]?.values[0]?.[0] as number ?? 0;
  }
  
  private mapRowToCategory(row: unknown[], columns: string[]): Category {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    
    return {
      id: obj.id as string,
      name: obj.name as string,
      color: obj.color as string,
      icon: obj.icon as string | undefined,
      parentId: obj.parentId as string | undefined,
      createdAt: obj.createdAt as string,
      updatedAt: obj.updatedAt as string,
    };
  }
}

export const categoryRepository = new CategoryRepository();
