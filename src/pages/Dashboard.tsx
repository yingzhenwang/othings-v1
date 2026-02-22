// Dashboard Page

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Folder, Bell, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { itemRepository } from '../features/items/services/itemRepository';
import { categoryRepository } from '../features/categories/services/categoryRepository';
import { reminderRepository } from '../features/reminders/services/reminderRepository';
import { DashboardStats } from '../shared/types';
import './Dashboard.css';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = () => {
    try {
      const totalItems = itemRepository.getTotalQuantity();
      const totalValue = itemRepository.getTotalValue();
      const newItemsThisMonth = itemRepository.getCountThisMonth();
      const categoryCount = categoryRepository.count();
      const reminderStatuses = reminderRepository.getByStatus();
      
      setStats({
        totalItems,
        totalValue,
        newItemsThisMonth,
        reminders: {
          overdue: reminderStatuses.overdue.length,
          upcoming: reminderStatuses.upcoming.length,
          completed: reminderStatuses.completed.length,
        }
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="dashboard">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>
        <div className="loading">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Overview of your items and reminders</p>
      </div>
      
      <div className="stats-grid">
        <Link to="/items" className="stat-card">
          <div className="stat-icon">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.totalItems ?? 0}</span>
            <span className="stat-label">Total Items</span>
          </div>
        </Link>
        
        <div className="stat-card">
          <div className="stat-icon accent">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">${(stats?.totalValue ?? 0).toLocaleString()}</span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
        
        <Link to="/categories" className="stat-card">
          <div className="stat-icon">
            <Folder size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.newItemsThisMonth ?? 0}</span>
            <span className="stat-label">Added This Month</span>
          </div>
        </Link>
        
        <Link to="/reminders" className="stat-card">
          <div className="stat-icon warning">
            <Bell size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.reminders.overdue ?? 0) + (stats?.reminders.upcoming ?? 0)}</span>
            <span className="stat-label">Active Reminders</span>
          </div>
        </Link>
      </div>
      
      {/* Reminder Summary */}
      <div className="reminder-summary">
        <h2>Reminder Status</h2>
        <div className="reminder-cards">
          <div className="reminder-card overdue">
            <AlertCircle size={20} />
            <div>
              <span className="count">{stats?.reminders.overdue ?? 0}</span>
              <span className="label">Overdue</span>
            </div>
          </div>
          
          <div className="reminder-card upcoming">
            <Clock size={20} />
            <div>
              <span className="count">{stats?.reminders.upcoming ?? 0}</span>
              <span className="label">Upcoming</span>
            </div>
          </div>
          
          <div className="reminder-card completed">
            <CheckCircle size={20} />
            <div>
              <span className="count">{stats?.reminders.completed ?? 0}</span>
              <span className="label">Completed</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/items?action=new" className="action-card">
            <Package size={20} />
            <span>Add Item</span>
          </Link>
          <Link to="/categories?action=new" className="action-card">
            <Folder size={20} />
            <span>Add Category</span>
          </Link>
          <Link to="/reminders?action=new" className="action-card">
            <Bell size={20} />
            <span>Add Reminder</span>
          </Link>
          <Link to="/reports" className="action-card">
            <TrendingUp size={20} />
            <span>View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
