import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Grid,
  List,
  Filter,
  Trash2,
  Edit,
  X,
  Package,
} from 'lucide-react';
import { useItems, useCategories, useDebounce } from '../hooks/useDatabase';
import { Item, Condition } from '../types';
import { formatCurrency, getConditionColor } from '../utils';
import { Pagination } from '../components/Pagination';
import * as db from '../services/database';
import * as search from '../services/search';

const conditions: Condition[] = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

const PAGE_SIZE = 20;

export function ItemsList() {
  const { items, refresh } = useItems();
  const { categories } = useCategories();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'normal' | 'llm'>('normal');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    condition: '',
  });

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch) {
      if (searchMode === 'llm') {
        setIsSearching(true);
        search.llmSearch(debouncedSearch)
          .then(result => {
            setFilteredItems(result.items);
            setIsSearching(false);
          })
          .catch(() => {
            setIsSearching(false);
          });
      } else {
        const results = search.normalSearch(debouncedSearch, items);
        applyFilters(results);
      }
    } else {
      applyFilters(items);
    }
  }, [debouncedSearch, searchMode, items]);

  useEffect(() => {
    applyFilters(searchQuery ? search.normalSearch(debouncedSearch, items) : items);
  }, [filters, items, searchQuery, debouncedSearch]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, debouncedSearch]);

  const applyFilters = (itemsToFilter: Item[]) => {
    let result = itemsToFilter;

    if (filters.category) {
      result = result.filter(item => item.category === filters.category);
    }
    if (filters.location) {
      result = result.filter(item =>
        item.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.condition) {
      result = result.filter(item => item.condition === filters.condition);
    }

    setFilteredItems(result);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this item?')) {
      db.deleteItem(id);
      refresh();
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedItems.size} items?`)) {
      selectedItems.forEach(id => db.deleteItem(id));
      setSelectedItems(new Set());
      refresh();
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const clearFilters = () => {
    setFilters({ category: '', location: '', condition: '' });
    setSearchQuery('');
  };

  const hasActiveFilters = filters.category || filters.location || filters.condition;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Items</h1>
        <Link to="/items/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Add Item
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-4">
        <div className="flex flex-col gap-3">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>

            <div className="flex gap-2">
              <button
                className={`btn btn-sm ${searchMode === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSearchMode('normal')}
              >
                Normal
              </button>
              <button
                className={`btn btn-sm ${searchMode === 'llm' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSearchMode('llm')}
              >
                AI
              </button>
            </div>

            <button
              className={`btn btn-secondary ${hasActiveFilters ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                  {(filters.category ? 1 : 0) + (filters.location ? 1 : 0) + (filters.condition ? 1 : 0)}
                </span>
              )}
            </button>

            <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
              <button
                className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-500/20' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                className={`p-2 ${viewMode === 'list' ? 'bg-indigo-500/20' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-[var(--color-border)]">
              <div className="input-group" style={{ minWidth: '150px' }}>
                <label className="label text-xs">Category</label>
                <select
                  className="select text-sm py-2"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">All</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ minWidth: '150px' }}>
                <label className="label text-xs">Location</label>
                <input
                  type="text"
                  className="input text-sm py-2"
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>

              <div className="input-group" style={{ minWidth: '150px' }}>
                <label className="label text-xs">Condition</label>
                <select
                  className="select text-sm py-2"
                  value={filters.condition}
                  onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                >
                  <option value="">All</option>
                  {conditions.map((cond) => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <span className="text-sm font-medium">{selectedItems.size} selected</span>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedItems(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          {isSearching && ' - Searching...'}
        </p>
      </div>

      {/* Paginated Items */}
      {(() => {
        const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const paginatedItems = filteredItems.slice(startIndex, startIndex + PAGE_SIZE);

        return (
          <>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />

            {paginatedItems.length === 0 ? (
              <div className="card p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-muted)] opacity-50" />
                <p className="text-[var(--color-text-secondary)] mb-4">No items found</p>
                <Link to="/items/new" className="btn btn-primary">
                  <Plus className="w-4 h-4" />
                  Add First Item
                </Link>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedItems.map((item) => (
            <div key={item.id} className="card overflow-hidden group">
              <div
                className="h-36 bg-[var(--color-bg-tertiary)]"
                style={{
                  backgroundImage: item.photos?.[0] ? `url(${item.photos[0]})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!item.photos?.length && (
                  <div className="h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-[var(--color-text-muted)] opacity-30" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4 rounded"
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate mb-1">{item.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-2">{item.category || 'Uncategorized'}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="badge text-xs"
                    style={{
                      backgroundColor: `${getConditionColor(item.condition)}20`,
                      color: getConditionColor(item.condition),
                    }}
                  >
                    {item.condition}
                  </span>
                  {item.quantity > 1 && (
                    <span className="badge badge-gray text-xs">x{item.quantity}</span>
                  )}
                </div>
                {item.purchase_price && (
                  <p className="font-semibold text-sm mb-2">
                    {formatCurrency(item.purchase_price, item.currency)}
                  </p>
                )}
                {item.location && (
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{item.location}</p>
                )}
                <div className="flex gap-1 mt-3 pt-3 border-t border-[var(--color-border)]">
                  <Link to={`/items/${item.id}`} className="btn btn-outline btn-sm flex-1">
                    View
                  </Link>
                  <Link to={`/items/${item.id}/edit`} className="btn btn-ghost btn-sm">
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button className="btn btn-ghost btn-sm text-red-400" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredItems.length}
                    onChange={() => {
                      if (selectedItems.size === filteredItems.length) {
                        setSelectedItems(new Set());
                      } else {
                        setSelectedItems(new Set(filteredItems.map(i => i.id)));
                      }
                    }}
                  />
                </th>
                <th>Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Qty</th>
                <th>Value</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td>
                    <Link to={`/items/${item.id}`} className="font-medium hover:text-indigo-400">
                      {item.name}
                    </Link>
                  </td>
                  <td className="text-sm text-[var(--color-text-secondary)]">{item.category || '-'}</td>
                  <td className="text-sm text-[var(--color-text-secondary)]">{item.location || '-'}</td>
                  <td>
                    <span
                      className="badge text-xs"
                      style={{
                        backgroundColor: `${getConditionColor(item.condition)}20`,
                        color: getConditionColor(item.condition),
                      }}
                    >
                      {item.condition}
                    </span>
                  </td>
                  <td>{item.quantity}</td>
                  <td className="font-medium">
                    {item.purchase_price ? formatCurrency(item.purchase_price, item.currency) : '-'}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/items/${item.id}/edit`} className="btn btn-ghost btn-sm">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button className="btn btn-ghost btn-sm text-red-400" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredItems.length / PAGE_SIZE)}
              onPageChange={setCurrentPage}
            />
          </>
        );
      })()}
    </div>
  );
}
