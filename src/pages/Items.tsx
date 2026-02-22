// Items Page - Item management with CRUD operations

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Filter, Grid, List, Edit2, Trash2, 
  MoreVertical, Package, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { itemRepository } from '../features/items/services/itemRepository';
import { categoryRepository } from '../features/categories/services/categoryRepository';
import { Item, ItemFilters, Category, ItemStatus } from '../shared/types';
import './Items.css';

type ViewMode = 'grid' | 'list';

export function Items() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    quantity: 1,
    description: '',
    location: '',
    status: 'active' as ItemStatus,
    purchasePrice: '',
    purchaseDate: '',
    warrantyExpiry: ''
  });
  
  useEffect(() => {
    loadData();
    
    // Check if we need to open modal for new item
    if (searchParams.get('action') === 'new') {
      setShowModal(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, []);
  
  const loadData = () => {
    try {
      const allItems = itemRepository.findAll();
      const allCategories = categoryRepository.findAll();
      setItems(allItems);
      setCategories(allCategories);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s) ||
        item.location?.toLowerCase().includes(s)
      );
    }
    
    if (categoryFilter) {
      result = result.filter(item => item.categoryId === categoryFilter);
    }
    
    if (statusFilter) {
      result = result.filter(item => item.status === statusFilter);
    }
    
    return result;
  }, [items, search, categoryFilter, statusFilter]);
  
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, page]);
  
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  
  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
  };
  
  const openNewModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      categoryId: '',
      quantity: 1,
      description: '',
      location: '',
      status: 'active',
      purchasePrice: '',
      purchaseDate: '',
      warrantyExpiry: ''
    });
    setShowModal(true);
  };
  
  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId || '',
      quantity: item.quantity,
      description: item.description || '',
      location: item.location || '',
      status: item.status,
      purchasePrice: item.purchasePrice?.toString() || '',
      purchaseDate: item.purchaseDate || '',
      warrantyExpiry: item.warrantyExpiry || ''
    });
    setShowModal(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        itemRepository.update({
          id: editingItem.id,
          name: formData.name,
          categoryId: formData.categoryId || null,
          quantity: formData.quantity,
          description: formData.description || undefined,
          location: formData.location || undefined,
          status: formData.status,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
          purchaseDate: formData.purchaseDate || undefined,
          warrantyExpiry: formData.warrantyExpiry || undefined
        });
      } else {
        itemRepository.create({
          name: formData.name,
          categoryId: formData.categoryId || null,
          quantity: formData.quantity,
          description: formData.description || undefined,
          location: formData.location || undefined,
          status: formData.status,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
          purchaseDate: formData.purchaseDate || undefined,
          warrantyExpiry: formData.warrantyExpiry || undefined
        });
      }
      
      loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        itemRepository.delete(id);
        loadData();
      } catch (error) {
        console.error item:', error);
('Failed to delete      }
    }
  };
  
  const getCategoryById = (id: string | null) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
  };
  
  if (loading) {
    return <div className="items-page">Loading...</div>;
  }
  
  return (
    <div className="items-page">
      <div className="page-header">
        <div>
          <h1>Items</h1>
          <p className="page-subtitle">{filteredItems.length} items</p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} />
          Add Item
        </button>
      </div>
      
      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>
        
        <select 
          value={categoryFilter} 
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        
        <select 
          value={statusFilter} 
          onChange={e => { setStatusFilter(e.target.value as ItemStatus | ''); setPage(1); }}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discarded">Discarded</option>
        </select>
        
        <div className="view-toggle">
          <button 
            className={viewMode === 'list' ? 'active' : ''} 
            onClick={() => setViewMode('list')}
          >
            <List size={18} />
          </button>
          <button 
            className={viewMode === 'grid' ? 'active' : ''} 
            onClick={() => setViewMode('grid')}
          >
            <Grid size={18} />
          </button>
        </div>
      </div>
      
      {/* Items List */}
      {paginatedItems.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>No items found</h3>
          <p>Add your first item to get started</p>
          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={18} />
            Add Item
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="items-list">
          <div className="list-header">
            <span className="col-name">Name</span>
            <span className="col-category">Category</span>
            <span className="col-quantity">Qty</span>
            <span className="col-location">Location</span>
            <span className="col-status">Status</span>
            <span className="col-actions"></span>
          </div>
          {paginatedItems.map(item => {
            const category = getCategoryById(item.categoryId);
            return (
              <div key={item.id} className="list-row">
                <span className="col-name">
                  <span className="item-name">{item.name}</span>
                  {item.description && <span className="item-desc">{item.description}</span>}
                </span>
                <span className="col-category">
                  {category ? (
                    <span className="category-tag" style={{ backgroundColor: category.color + '20', color: category.color }}>
                      {category.name}
                    </span>
                  ) : '-'}
                </span>
                <span className="col-quantity">{item.quantity}</span>
                <span className="col-location">{item.location || '-'}</span>
                <span className="col-status">
                  <span className={`status-badge ${item.status}`}>{item.status}</span>
                </span>
                <span className="col-actions">
                  <button className="icon-btn" onClick={() => openEditModal(item)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="items-grid">
          {paginatedItems.map(item => {
            const category = getCategoryById(item.categoryId);
            return (
              <div key={item.id} className="item-card">
                <div className="item-card-header">
                  <span className={`status-dot ${item.status}`}></span>
                  <div className="item-actions">
                    <button className="icon-btn" onClick={() => openEditModal(item)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="item-name">{item.name}</h3>
                {item.description && <p className="item-desc">{item.description}</p>}
                <div className="item-meta">
                  {category && (
                    <span className="category-tag" style={{ backgroundColor: category.color + '20', color: category.color }}>
                      {category.name}
                    </span>
                  )}
                  <span className="quantity">×{item.quantity}</span>
                </div>
                {item.location && <span className="item-location">{item.location}</span>}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          <div className="page-controls">
            <button 
              className="btn btn-secondary" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="btn btn-secondary" 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
      
      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
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
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
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
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as ItemStatus })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discarded">Discarded</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Purchase Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Warranty Expiry</label>
                  <input
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={e => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
