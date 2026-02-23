// Items Page
import { useState, useEffect, useMemo, useCallback } from 'react';
import { itemRepository } from '@/features/items/services/itemRepository';
import { categoryRepository } from '@/features/categories/services/categoryRepository';
import type { Item, Category, CreateItemInput } from '@/shared/types';

const ITEMS_PER_PAGE = 20;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'purchasePrice' | 'quantity';
type SortDir = 'asc' | 'desc';

export function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  
  const hasFilters = search || statusFilter || categoryFilter || locationFilter;
  
  const activeFilterCount = [statusFilter, categoryFilter, locationFilter].filter(Boolean).length + (search ? 1 : 0);
  
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setLocationFilter('');
    setCurrentPage(1);
  };
  
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

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      // Search filter (debounced)
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        if (!item.name.toLowerCase().includes(s) && 
            !item.description?.toLowerCase().includes(s) && 
            !item.location?.toLowerCase().includes(s)) {
          return false;
        }
      }
      // Status filter
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter && item.categoryId !== categoryFilter) {
        return false;
      }
      // Location filter
      if (locationFilter && item.location !== locationFilter) {
        return false;
      }
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'purchasePrice':
          cmp = (a.purchasePrice || 0) - (b.purchasePrice || 0);
          break;
        case 'quantity':
          cmp = a.quantity - b.quantity;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [items, debouncedSearch, statusFilter, categoryFilter, locationFilter, sortBy, sortDir]);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    items.forEach(item => {
      if (item.location) locs.add(item.location);
    });
    return Array.from(locs).sort();
  }, [items]);

  // Stats
  const stats = useMemo(() => {
    const totalValue = filteredItems.reduce((sum, item) => {
      return sum + (item.purchasePrice || 0) * item.quantity;
    }, 0);
    const totalQty = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    return { totalValue, totalQty };
  }, [filteredItems]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || formData.name.trim() === '') {
      alert('Please enter a name for the item');
      return;
    }
    
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
      alert('Failed to save item: ' + String(e));
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

  const getCategory = (id: string | null | undefined) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
  };

  const getCategoryName = (id: string | null | undefined) => {
    const cat = getCategory(id);
    return cat ? cat.name : '-';
  };

  const getCategoryColor = (id: string | null | undefined) => {
    const cat = getCategory(id);
    return cat ? cat.color : '#5c5f66';
  };

  // Format date for display
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Check if warranty expiring soon (within 30 days)
  const isWarrantyExpiringSoon = (dateStr: string | undefined) => {
    if (!dateStr) return false;
    const expiry = new Date(dateStr);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 30;
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
          <p className="page-subtitle">
            {filteredItems.length} items 
            {hasFilters && (
              <span style={{ 
                marginLeft: '8px', 
                padding: '2px 8px', 
                background: 'var(--color-accent)', 
                color: '#fff', 
                borderRadius: '10px',
                fontSize: '12px'
              }}>
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
            {stats.totalQty !== filteredItems.length && ` (${stats.totalQty} total)`}
            {stats.totalValue > 0 && ` • $${stats.totalValue.toLocaleString()}`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Item
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{ padding: '0 24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)'
            }}
          />
          
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              minWidth: '140px'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={e => { setLocationFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              minWidth: '140px'
            }}
          >
            <option value="">All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              minWidth: '120px'
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discarded">Discarded</option>
          </select>
        </div>
        
        {/* Sort Options */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Sort:</span>
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value as SortOption); setCurrentPage(1); }}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)'
            }}
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Created Date</option>
            <option value="name">Name</option>
            <option value="purchasePrice">Price</option>
            <option value="quantity">Quantity</option>
          </select>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)'
            }}
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
          
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid var(--color-danger)',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--color-danger)',
                marginLeft: 'auto'
              }}
            >
              ✕ Clear filters
            </button>
          )}
        </div>
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
            {paginatedItems.map(item => (
              <div key={item.id} style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{item.name}</div>
                    {item.categoryId && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: getCategoryColor(item.categoryId),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px'
                      }}>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: getCategoryColor(item.categoryId) 
                        }}></span>
                        {getCategoryName(item.categoryId)}
                      </div>
                    )}
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
                
                {/* Warranty badge */}
                {item.warrantyExpiry && (
                  <div style={{ 
                    fontSize: '12px', 
                    marginBottom: '8px',
                    color: isWarrantyExpiringSoon(item.warrantyExpiry) ? '#c05621' : 'var(--color-text-secondary)'
                  }}>
                    {isWarrantyExpiringSoon(item.warrantyExpiry) && '⚠️ '}
                    Warranty: {formatDate(item.warrantyExpiry)}
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
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <button 
                className="btn btn-secondary"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Prev
              </button>
              <span style={{ padding: '0 12px', fontSize: '14px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="btn btn-secondary"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
