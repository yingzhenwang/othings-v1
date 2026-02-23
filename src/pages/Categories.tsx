// Categories Page
import { useState, useEffect } from 'react';
import { categoryRepository } from '@/features/categories/services/categoryRepository';
import type { Category, CreateCategoryInput } from '@/shared/types';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    color: '#5c5f66',
    icon: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    try {
      const data = categoryRepository.findAll();
      setCategories(data);
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.name.trim() === '') {
      alert('Please enter a category name');
      return;
    }
    
    try {
      if (editingCategory) {
        categoryRepository.update(editingCategory.id, formData);
      } else {
        categoryRepository.create(formData);
      }
      loadCategories();
      resetForm();
    } catch (e) {
      console.error('Failed to save category:', e);
      alert('Failed to save category: ' + String(e));
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this category?')) {
      try {
        categoryRepository.delete(id);
        loadCategories();
      } catch (e) {
        console.error('Failed to delete:', e);
      }
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', color: '#5c5f66', icon: '' });
  };

  if (loading) {
    return (
      <div className="categories-page">
        <div className="page-header">
          <h1>Categories</h1>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="page-subtitle">{categories.length} categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Category
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit' : 'Add'} Category</h2>
              <button className="icon-btn" onClick={resetForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  style={{ width: '60px', height: '40px', padding: '2px' }}
                />
              </div>
              <div className="form-group">
                <label>Icon (emoji)</label>
                <input
                  type="text"
                  value={formData.icon || ''}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📦"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="empty-state">
          <p>No categories yet</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add your first category
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 24px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {categories.map(category => (
              <div key={category.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: category.color + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {category.icon || '🏷️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{category.name}</div>
                </div>
                <button className="icon-btn" onClick={() => handleEdit(category)}>✏️</button>
                <button className="icon-btn danger" onClick={() => handleDelete(category.id)}>🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
