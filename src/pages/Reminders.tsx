import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useReminders, useItems } from '../hooks/useDatabase';
import { Reminder, ReminderType } from '../types';
import { formatDate, isOverdue, getDaysUntil } from '../utils';
import * as db from '../services/database';

const reminderTypes: ReminderType[] = ['Warranty expiry', 'Maintenance', 'Replacement', 'Custom'];

export function Reminders() {
  const { reminders, refresh } = useReminders();
  const { items } = useItems();
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [formData, setFormData] = useState({
    item_id: '',
    type: 'Warranty expiry' as ReminderType,
    due_date: '',
    message: '',
    repeat: '',
  });

  const filteredReminders = reminders.filter((reminder) => {
    switch (filter) {
      case 'upcoming':
        return !reminder.is_completed && !isOverdue(reminder.due_date);
      case 'overdue':
        return !reminder.is_completed && isOverdue(reminder.due_date);
      case 'completed':
        return reminder.is_completed;
      default:
        return true;
    }
  });

  const getItemName = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item?.name || 'Unknown Item';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id || !formData.due_date) return;

    if (editingReminder) {
      db.updateReminder(editingReminder.id, {
        item_id: formData.item_id,
        type: formData.type,
        due_date: formData.due_date,
        message: formData.message,
        repeat: formData.repeat || null,
      });
    } else {
      db.createReminder({
        item_id: formData.item_id,
        type: formData.type,
        due_date: formData.due_date,
        message: formData.message,
        is_completed: false,
        repeat: formData.repeat || null,
      });
    }

    refresh();
    setShowModal(false);
    setEditingReminder(null);
    setFormData({ item_id: '', type: 'Warranty expiry', due_date: '', message: '', repeat: '' });
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      item_id: reminder.item_id,
      type: reminder.type,
      due_date: reminder.due_date.split('T')[0],
      message: reminder.message,
      repeat: reminder.repeat || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this reminder?')) {
      db.deleteReminder(id);
      refresh();
    }
  };

  const toggleComplete = (reminder: Reminder) => {
    db.updateReminder(reminder.id, { is_completed: !reminder.is_completed });
    refresh();
  };

  const openModal = () => {
    setEditingReminder(null);
    setFormData({ item_id: '', type: 'Warranty expiry', due_date: '', message: '', repeat: '' });
    setShowModal(true);
  };

  const upcomingCount = reminders.filter(r => !r.is_completed && !isOverdue(r.due_date)).length;
  const overdueCount = reminders.filter(r => !r.is_completed && isOverdue(r.due_date)).length;
  const completedCount = reminders.filter(r => r.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Reminders</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Manage your reminders</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus className="w-4 h-4" />
          Add Reminder
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('upcoming')}
          className={`card p-4 text-left transition-all ${filter === 'upcoming' ? 'ring-2 ring-indigo-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Upcoming</p>
              <p className="text-xl font-bold">{upcomingCount}</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`card p-4 text-left transition-all ${filter === 'overdue' ? 'ring-2 ring-red-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Overdue</p>
              <p className="text-xl font-bold">{overdueCount}</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`card p-4 text-left transition-all ${filter === 'completed' ? 'ring-2 ring-green-500' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-muted)]">Completed</p>
              <p className="text-xl font-bold">{completedCount}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'upcoming', 'overdue', 'completed'] as const).map((f) => (
          <button
            key={f}
            className={`btn btn-sm whitespace-nowrap ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-muted)] opacity-50" />
          <p className="text-[var(--color-text-secondary)] mb-4">No reminders</p>
          <button className="btn btn-primary" onClick={openModal}>
            <Plus className="w-4 h-4" />
            Add Reminder
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => {
            const overdue = isOverdue(reminder.due_date);
            const daysUntil = getDaysUntil(reminder.due_date);

            return (
              <div
                key={reminder.id}
                className={`card p-4 ${reminder.is_completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleComplete(reminder)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      reminder.is_completed
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-[var(--color-border)] hover:border-green-500'
                    }`}
                  >
                    {reminder.is_completed && <CheckCircle className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-primary">{reminder.type}</span>
                      <Link
                        to={`/items/${reminder.item_id}`}
                        className="font-medium hover:text-indigo-400 text-sm"
                      >
                        {getItemName(reminder.item_id)}
                      </Link>
                    </div>
                    {reminder.message && (
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">{reminder.message}</p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm ${
                      reminder.is_completed
                        ? 'text-[var(--color-text-muted)]'
                        : overdue
                        ? 'text-red-400'
                        : 'text-[var(--color-text-secondary)]'
                    }`}>
                      {formatDate(reminder.due_date)}
                    </p>
                    {!reminder.is_completed && !overdue && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {daysUntil === 0 ? 'Today' : `${daysUntil} days`}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(reminder)}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="btn btn-ghost btn-sm text-red-400" onClick={() => handleDelete(reminder.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold">
                {editingReminder ? 'Edit Reminder' : 'Add Reminder'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="input-group">
                  <label className="label">Item</label>
                  <select
                    value={formData.item_id}
                    onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                    className="select"
                    required
                  >
                    <option value="">Select an item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="label">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ReminderType })}
                    className="select"
                  >
                    {reminderTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="label">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="label">Message</label>
                  <input
                    type="text"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input"
                    placeholder="Reminder message"
                  />
                </div>

                <div className="input-group">
                  <label className="label">Repeat</label>
                  <select
                    value={formData.repeat}
                    onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
                    className="select"
                  >
                    <option value="">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingReminder ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
