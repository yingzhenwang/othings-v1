import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Laptop,
  Sofa,
  Shirt,
  BookOpen,
  Wrench,
  UtensilsCrossed,
  Dumbbell,
  Palette,
  Trophy,
  FileText,
  Tag,
} from 'lucide-react';
import { useCategories, useItems } from '../hooks/useDatabase';
import { Category } from '../types';
import * as db from '../services/database';

const iconMap: Record<string, React.ComponentType<any>> = {
  Package,
  Laptop,
  Sofa,
  Shirt,
  BookOpen,
  Wrench,
  UtensilsCrossed,
  Dumbbell,
  Palette,
  Trophy,
  FileText,
  Tag,
};

const availableIcons = Object.keys(iconMap);

export function Categories() {
  const { categories, refresh } = useCategories();
  const { items } = useItems();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'Package' });

  const getItemCount = (categoryName: string) => {
    return items.filter(item => item.category === categoryName).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      db.updateCategory(editingCategory.id, formData.name, formData.icon);
    } else {
      db.createCategory(formData.name, formData.icon);
    }

    refresh();
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', icon: 'Package' });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, icon: category.icon });
    setShowModal(true);
  };

  const handleDelete = (category: Category) => {
    if (!category.is_custom) {
      alert('Cannot delete system categories');
      return;
    }

    const itemCount = getItemCount(category.name);
    if (itemCount > 0) {
      alert(`Cannot delete category with ${itemCount} items.`);
      return;
    }

    if (window.confirm(`Delete "${category.name}"?`)) {
      db.deleteCategory(category.id);
      refresh();
    }
  };

  const openModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', icon: 'Package' });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Categories</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Organize your items</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] || Package;
          const count = getItemCount(category.name);

          return (
            <div key={category.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{category.name}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{count} item{count !== 1 ? 's' : ''}</p>
                </div>
                {category.is_custom && (
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(category)}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="btn btn-ghost btn-sm text-red-400" onClick={() => handleDelete(category)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {!category.is_custom && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2">System category</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-lg font-semibold">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="input-group">
                  <label className="label">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Category name"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="label">Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {availableIcons.map((iconName) => {
                      const Icon = iconMap[iconName];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          className={`p-2 rounded-lg border transition-all ${
                            formData.icon === iconName
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-[var(--color-border)] hover:border-[var(--color-border-light)]'
                          }`}
                          onClick={() => setFormData({ ...formData, icon: iconName })}
                        >
                          <Icon className="w-5 h-5 mx-auto" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
