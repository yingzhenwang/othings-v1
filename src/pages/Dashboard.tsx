// Dashboard Page
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { itemRepository } from '@/features/items/services/itemRepository';
import { categoryRepository } from '@/features/categories/services/categoryRepository';
import { reminderRepository } from '@/features/reminders/services/reminderRepository';
import type { Item } from '@/shared/types';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    categoryCount: 0,
    overdueReminders: 0,
    upcomingReminders: 0
  });
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{id: string; name: string; color: string}[]>([]);
  const [categoryItemCounts, setCategoryItemCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      const items = itemRepository.findAll();
      const categoriesData = categoryRepository.findAll();
      const reminders = reminderRepository.findAll();
      
      const totalValue = items.reduce((sum, item) => {
        return sum + (item.purchasePrice || 0) * item.quantity;
      }, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const overdue = reminders.filter(r => {
        if (r.completed) return false;
        const due = new Date(r.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
      }).length;
      
      const upcoming = reminders.filter(r => {
        if (r.completed) return false;
        const due = new Date(r.dueDate);
        due.setHours(0, 0, 0, 0);
        const upcoming = new Date(today);
        upcoming.setDate(upcoming.getDate() + 7);
        return due >= today && due <= upcoming;
      }).length;
      
      // Get recently added items (last 5)
      const sortedItems = [...items].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);
      
      // Get category item counts
      const catCounts: Record<string, number> = {};
      items.forEach(item => {
        if (item.categoryId) {
          catCounts[item.categoryId] = (catCounts[item.categoryId] || 0) + item.quantity;
        }
      });
      
      setStats({
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalValue,
        categoryCount: categoriesData.length,
        overdueReminders: overdue,
        upcomingReminders: upcoming
      });
      setRecentItems(sortedItems);
      setCategories(categoriesData);
      setCategoryItemCounts(catCounts);
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Overview of your items</p>
        </div>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <span className="stat-value">{stats.totalItems}</span>
              <span className="stat-label">Total Items</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d4edda', color: '#155724' }}>💰</div>
            <div className="stat-content">
              <span className="stat-value">${stats.totalValue.toLocaleString()}</span>
              <span className="stat-label">Total Value</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#e2e3f5', color: '#383d41' }}>🏷️</div>
            <div className="stat-content">
              <span className="stat-value">{stats.categoryCount}</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f8d7da', color: '#721c24' }}>⏰</div>
            <div className="stat-content">
              <span className="stat-value">{stats.overdueReminders + stats.upcomingReminders}</span>
              <span className="stat-label">Active Reminders</span>
            </div>
          </div>
        </div>

        {/* Empty State - Show when no items */}
        {stats.totalItems === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '12px',
            marginBottom: '32px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Welcome to OThings!</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              Start by adding your first item
            </p>
            <Link to="/items" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'var(--color-accent)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}>
              <span>➕</span> Add First Item
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '32px'
        }}>
          <Link to="/items" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)'
          }}>
            <span>➕</span>
            <span>Add Item</span>
          </Link>
          
          <Link to="/categories" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)'
          }}>
            <span>🏷️</span>
            <span>Categories</span>
          </Link>
          
          <Link to="/reminders" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '8px',
            textDecoration: 'none',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)'
          }}>
            <span>⏰</span>
            <span>Reminders</span>
          </Link>
        </div>

        {/* Reminder Status */}
        {(stats.overdueReminders > 0 || stats.upcomingReminders > 0) && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Reminder Status</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              {stats.overdueReminders > 0 && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fff5f5',
                  border: '1px solid #fed7d7',
                  borderRadius: '8px',
                  color: '#c53030'
                }}>
                  ⚠️ {stats.overdueReminders} overdue
                </div>
              )}
              {stats.upcomingReminders > 0 && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fffaf0',
                  border: '1px solid #feebc8',
                  borderRadius: '8px',
                  color: '#c05621'
                }}>
                  📅 {stats.upcomingReminders} upcoming
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories with items */}
        {categories.length > 0 && Object.keys(categoryItemCounts).length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
              <Link to="/categories" style={{ color: 'inherit', textDecoration: 'none' }}>
                By Category
              </Link>
            </h2>
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {categories.filter(c => categoryItemCounts[c.id]).map(cat => (
                <Link 
                  key={cat.id}
                  to="/categories"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: cat.color + '15',
                    borderRadius: '20px',
                    textDecoration: 'none',
                    color: 'var(--color-text-primary)',
                    border: `1px solid ${cat.color}30`
                  }}
                >
                  <span style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%', 
                    background: cat.color 
                  }}></span>
                  <span style={{ fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg-primary)',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {categoryItemCounts[cat.id]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Items */}
        {recentItems.length > 0 && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
              <Link to="/items" style={{ color: 'inherit', textDecoration: 'none' }}>
                Recently Added
              </Link>
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              {recentItems.map(item => {
                const cat = getCategoryName(item.categoryId);
                return (
                  <Link 
                    key={item.id} 
                    to="/items"
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color var(--transition-fast)'
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {cat && (
                        <>
                          <span style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            background: cat.color 
                          }}></span>
                          {cat.name}
                        </>
                      )}
                      {!cat && <span>Uncategorized</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
