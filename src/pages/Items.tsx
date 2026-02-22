// Items Page
import { useState, useEffect } from 'react';
import { itemRepository } from '@/features/items/services/itemRepository';
import { categoryRepository } from '@/features/categories/services/categoryRepository';
import type { Item, Category, CreateItemInput } from '@/shared/types';

export function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<CreateItemInput>({
    name: '',
    categoryId: undefined,
    quantity: 1,
    description: undefined,
    location: undefined,
    status: 'active',
    purchasePrice: undefined,
    purchaseDate: undefined,
    warrantyExpiry: undefined
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const itemsData = itemRepository.findAll();
      const catsData = categoryRepository.findAll();
      setItems(itemsData);
      setCategories(catsData);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(s) ||
      item.description?.toLowerCase().includes(s) ||
      item.location?.toLowerCase().includes(s)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        itemRepository.update({ id: editingItem.id, ...formData });
      } else {
        itemRepository.create(formData);
      }
      loadData();
      resetForm();
    } catch (e) {
      console.error('Failed to save item:', e);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this item?')) {
      try {
        itemRepository.delete(id);
        loadData();
      } catch (e) {
        console.error('Failed to delete:', e);
      }
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId,
      quantity: item.quantity,
      description: item.description,
      location: item.location,
      status: item.status,
      purchasePrice: item.purchasePrice,
      purchaseDate: item.purchaseDate,
      warrantyExpiry: item.warrantyExpiry
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      categoryId: undefined,
      quantity: 1,
      description: undefined,
      location: undefined,
      status: 'active',
      purchasePrice: undefined,
      purchaseDate: undefined,
      warrantyExpiry: undefined
    });
  };

  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return '-';
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : '-';
  };

  if (loading) {
    return (
      <div className="items-page">
        <div className="page-header">
          <h1>Items</h1>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1>Items</h1>
          <p className="page-subtitle">{filteredItems.length} items</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Item
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 24px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '14px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text)'
          }}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit' : 'Add'} Item</h2>
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
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.categoryId || ''}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value || undefined })}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value || undefined })}
                  rows={2}
                />
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value || undefined })}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discarded">Discarded</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice || ''}
                    onChange={e => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate || ''}
                    onChange={e => setFormData({ ...formData, purchaseDate: e.target.value || undefined })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Warranty Expiry</label>
                  <input
                    type="date"
                    value={formData.warrantyExpiry || ''}
                    onChange={e => setFormData({ ...formData, warrantyExpiry: e.target.value || undefined })}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <p>No items found</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add your first item
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 24px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {filteredItems.map(item => (
              <div key={item.id} style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{item.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {getCategoryName(item.categoryId)}
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    background: item.status === 'active' ? '#d4edda' : item.status === 'inactive' ? '#fff3cd' : '#f8d7da',
                    color: item.status === 'active' ? '#155724' : item.status === 'inactive' ? '#856404' : '#721c24'
                  }}>
                    {item.status}
                  </span>
                </div>
                
                {item.description && (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    {item.description}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Qty: {item.quantity}
                    {item.purchasePrice && ` • $${item.purchasePrice}`}
                  </div>
                  <div>
                    <button className="icon-btn" onClick={() => handleEdit(item)}>✏️</button>
                    <button className="icon-btn danger" onClick={() => handleDelete(item.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
