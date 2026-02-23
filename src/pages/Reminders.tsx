// Reminders Page
import { useState, useEffect } from 'react';
import { reminderRepository } from '@/features/reminders/services/reminderRepository';
import { itemRepository } from '@/features/items/services/itemRepository';
import type { Reminder, CreateReminderInput } from '@/shared/types';

export function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [items, setItems] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateReminderInput>({
    itemId: '',
    title: '',
    dueDate: '',
    notifyBefore: 7
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const allReminders = reminderRepository.findAll();
      const allItems = itemRepository.findAll().map(i => ({ id: i.id, name: i.name }));
      setReminders(allReminders);
      setItems(allItems);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemId || !formData.title || !formData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      reminderRepository.create(formData);
      loadData();
      resetForm();
    } catch (e) {
      console.error('Failed to create reminder:', e);
      alert('Failed to create reminder: ' + String(e));
    }
  };

  const handleToggle = (id: string, completed: boolean) => {
    try {
      if (completed) {
        reminderRepository.markIncomplete(id);
      } else {
        reminderRepository.markComplete(id);
      }
      loadData();
    } catch (e) {
      console.error('Failed to toggle:', e);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this reminder?')) {
      try {
        reminderRepository.delete(id);
        loadData();
      } catch (e) {
        console.error('Failed to delete:', e);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({ itemId: '', title: '', dueDate: '', notifyBefore: 7 });
  };

  const getStatus = (reminder: Reminder): 'overdue' | 'upcoming' | 'completed' => {
    if (reminder.completed) return 'completed';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(reminder.dueDate);
    due.setHours(0, 0, 0, 0);
    if (due < today) return 'overdue';
    const upcoming = new Date(today);
    upcoming.setDate(upcoming.getDate() + reminder.notifyBefore);
    if (due <= upcoming) return 'upcoming';
    return 'completed';
  };

  const getItemName = (itemId: string) => {
    return items.find(i => i.id === itemId)?.name || 'Unknown';
  };

  const grouped = {
    overdue: reminders.filter(r => getStatus(r) === 'overdue'),
    upcoming: reminders.filter(r => getStatus(r) === 'upcoming'),
    completed: reminders.filter(r => getStatus(r) === 'completed')
  };

  if (loading) {
    return (
      <div className="reminders-page">
        <div className="page-header">
          <h1>Reminders</h1>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="reminders-page">
      <div className="page-header">
        <div>
          <h1>Reminders</h1>
          <p className="page-subtitle">{reminders.length} reminders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Reminder
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Reminder</h2>
              <button className="icon-btn" onClick={resetForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Item *</label>
                <select
                  value={formData.itemId}
                  onChange={e => setFormData({ ...formData, itemId: e.target.value })}
                  required
                >
                  <option value="">Select an item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Notify Before (days)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.notifyBefore}
                  onChange={e => setFormData({ ...formData, notifyBefore: parseInt(e.target.value) || 7 })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="empty-state">
          <p>No reminders yet</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add your first reminder
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 24px' }}>
          {grouped.overdue.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#c53030', marginBottom: '12px' }}>⚠️ Overdue ({grouped.overdue.length})</h3>
              {grouped.overdue.map(r => (
                <div key={r.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#fff5f5',
                  border: '1px solid #fed7d7',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <input
                    type="checkbox"
                    checked={r.completed}
                    onChange={() => handleToggle(r.id, r.completed)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{r.title}</div>
                    <div style={{ fontSize: '13px', color: '#c53030' }}>
                      {getItemName(r.itemId)} • {r.dueDate}
                    </div>
                  </div>
                  <button className="icon-btn danger" onClick={() => handleDelete(r.id)}>🗑️</button>
                </div>
              ))}
            </div>
          )}

          {grouped.upcoming.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#c05621', marginBottom: '12px' }}>📅 Upcoming ({grouped.upcoming.length})</h3>
              {grouped.upcoming.map(r => (
                <div key={r.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: '#fffaf0',
                  border: '1px solid #feebc8',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  <input
                    type="checkbox"
                    checked={r.completed}
                    onChange={() => handleToggle(r.id, r.completed)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{r.title}</div>
                    <div style={{ fontSize: '13px', color: '#c05621' }}>
                      {getItemName(r.itemId)} • {r.dueDate}
                    </div>
                  </div>
                  <button className="icon-btn danger" onClick={() => handleDelete(r.id)}>🗑️</button>
                </div>
              ))}
            </div>
          )}

          {grouped.completed.length > 0 && (
            <div>
              <h3 style={{ color: '#38a169', marginBottom: '12px' }}>✅ Completed ({grouped.completed.length})</h3>
              {grouped.completed.slice(0, 5).map(r => (
                <div key={r.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  opacity: 0.7
                }}>
                  <input
                    type="checkbox"
                    checked={r.completed}
                    onChange={() => handleToggle(r.id, r.completed)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, textDecoration: 'line-through' }}>{r.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {getItemName(r.itemId)}
                    </div>
                  </div>
                  <button className="icon-btn danger" onClick={() => handleDelete(r.id)}>🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
