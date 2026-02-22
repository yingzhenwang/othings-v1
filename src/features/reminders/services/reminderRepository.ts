// Reminder Repository - Database operations for Reminders

import { getDatabase, generateId, getTimestamp, saveDatabase } from '@/shared/db';
import { Reminder, CreateReminderInput, ReminderStatus } from '@/shared/types';

export class ReminderRepository {
  findAll(): Reminder[] {
    const db = getDatabase();
    const results = db.exec('SELECT * FROM reminders ORDER BY dueDate ASC');
    if (results.length === 0) return [];
    
    return results[0].values.map(row => this.mapRowToReminder(row, results[0].columns));
  }
  
  findById(id: string): Reminder | null {
    const db = getDatabase();
    const results = db.exec('SELECT * FROM reminders WHERE id = ?', [id]);
    
    if (results.length === 0 || results[0].values.length === 0) return null;
    
    return this.mapRowToReminder(results[0].values[0], results[0].columns);
  }
  
  findByItemId(itemId: string): Reminder[] {
    const db = getDatabase();
    const results = db.exec('SELECT * FROM reminders WHERE itemId = ? ORDER BY dueDate ASC', [itemId]);
    if (results.length === 0) return [];
    
    return results[0].values.map(row => this.mapRowToReminder(row, results[0].columns));
  }
  
  create(input: CreateReminderInput): Reminder {
    const db = getDatabase();
    const id = generateId();
    const now = getTimestamp();
    
    db.run(`
      INSERT INTO reminders (id, itemId, title, dueDate, completed, notifyBefore, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.itemId,
      input.title,
      input.dueDate,
      0, // completed = false
      input.notifyBefore ?? 7,
      now,
      now
    ]);
    
    saveDatabase();
    
    return this.findById(id)!;
  }
  
  update(id: string, input: Partial<CreateReminderInput & { completed: boolean }>): Reminder {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Reminder not found: ${id}`);
    }
    
    const now = getTimestamp();
    const updates: string[] = [];
    const params: (string | number | null)[] = [];
    
    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }
    if (input.dueDate !== undefined) {
      updates.push('dueDate = ?');
      params.push(input.dueDate);
    }
    if (input.completed !== undefined) {
      updates.push('completed = ?');
      params.push(input.completed ? 1 : 0);
      if (input.completed) {
        updates.push('completedAt = ?');
        params.push(now);
      } else {
        updates.push('completedAt = ?');
        params.push(null);
      }
    }
    if (input.notifyBefore !== undefined) {
      updates.push('notifyBefore = ?');
      params.push(input.notifyBefore);
    }
    if (input.itemId !== undefined) {
      updates.push('itemId = ?');
      params.push(input.itemId);
    }
    
    updates.push('updatedAt = ?');
    params.push(now);
    params.push(id);
    
    db.run(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDatabase();
    
    return this.findById(id)!;
  }
  
  delete(id: string): void {
    const db = getDatabase();
    db.run('DELETE FROM reminders WHERE id = ?', [id]);
    saveDatabase();
  }
  
  // Get reminders by status
  getByStatus(): { overdue: Reminder[]; upcoming: Reminder[]; completed: Reminder[] } {
    const all = this.findAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdue: Reminder[] = [];
    const upcoming: Reminder[] = [];
    const completed: Reminder[] = [];
    
    for (const reminder of all) {
      const status = this.getStatus(reminder, today);
      if (status === 'completed') {
        completed.push(reminder);
      } else if (status === 'overdue') {
        overdue.push(reminder);
      } else if (status === 'upcoming') {
        upcoming.push(reminder);
      }
    }
    
    return { overdue, upcoming, completed };
  }
  
  getStatus(reminder: Reminder, today: Date = new Date()): ReminderStatus {
    if (reminder.completed) return 'completed';
    
    const dueDate = new Date(reminder.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return 'overdue';
    
    const upcomingDate = new Date(today);
    upcomingDate.setDate(upcomingDate.getDate() + reminder.notifyBefore);
    
    if (dueDate <= upcomingDate) return 'upcoming';
    
    return 'completed'; // Not overdue, not upcoming - treat as completed
  }
  
  markComplete(id: string): Reminder {
    return this.update(id, { completed: true });
  }
  
  markIncomplete(id: string): Reminder {
    return this.update(id, { completed: false });
  }
  
  count(): number {
    const db = getDatabase();
    const results = db.exec('SELECT COUNT(*) as count FROM reminders');
    return results[0]?.values[0]?.[0] as number ?? 0;
  }
  
  private mapRowToReminder(row: unknown[], columns: string[]): Reminder {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    
    return {
      id: obj.id as string,
      itemId: obj.itemId as string,
      title: obj.title as string,
      dueDate: obj.dueDate as string,
      completed: Boolean(obj.completed),
      completedAt: obj.completedAt as string | undefined,
      notifyBefore: obj.notifyBefore as number,
      createdAt: obj.createdAt as string,
      updatedAt: obj.updatedAt as string,
    };
  }
}

export const reminderRepository = new ReminderRepository();
