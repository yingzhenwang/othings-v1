import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Camera,
  QrCode,
  Tag,
} from 'lucide-react';
import { useItem, useCategories } from '../hooks/useDatabase';
import { Item, Condition } from '../types';
import { compressImage, fileToBase64, generateQRCodeData } from '../utils';
import * as db from '../services/database';

const conditions: Condition[] = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'];

export function ItemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { item, refresh } = useItem(id || '');
  const { categories } = useCategories();

  const isNew = !id || id === 'new';

  const [formData, setFormData] = useState<Partial<Item>>({
    name: '',
    description: '',
    category: '',
    tags: [],
    quantity: 1,
    location: '',
    condition: 'Good',
    uses_left: null,
    total_uses: null,
    purchase_date: null,
    purchase_price: null,
    currency: 'USD',
    purchase_place: '',
    warranty_expiry: null,
    brand: '',
    model: '',
    serial_number: '',
    notes: '',
    photos: [],
    qr_code: '',
    custom_fields: {},
  });

  const [tagInput, setTagInput] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : null) : value,
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      const compressed = await compressImage(base64);
      newPhotos.push(compressed);
    }

    setFormData((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), ...newPhotos],
    }));
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Name is required');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        db.createItem(formData as Omit<Item, 'id' | 'created_at' | 'updated_at'>);
      } else if (id) {
        db.updateItem(id, formData);
      }
      navigate('/items');
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      if (id) {
        db.deleteItem(id);
        navigate('/items');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/items" className="btn btn-ghost">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">
          {isNew ? 'Add New Item' : 'Edit Item'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="input-group">
              <label className="label">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="input-group">
              <label className="label">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="input"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="input-group">
                <label className="label">Category</label>
                <select
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="select"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="label">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Living Room, Garage"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="input-group">
                <label className="label">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity || 1}
                  onChange={handleChange}
                  className="input"
                  min={1}
                />
              </div>

              <div className="input-group">
                <label className="label">Condition</label>
                <select
                  name="condition"
                  value={formData.condition || 'Good'}
                  onChange={handleChange}
                  className="select"
                >
                  {conditions.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="input-group">
              <label className="label">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="input"
                  placeholder="Add tag and press Enter"
                />
                <button type="button" className="btn btn-outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="badge badge-primary flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purchase Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Purchase Details</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="input-group">
                <label className="label">Purchase Date</label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="input-group">
                <label className="label">Purchase Price</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="purchase_price"
                    value={formData.purchase_price || ''}
                    onChange={handleChange}
                    className="input"
                    step="0.01"
                    min="0"
                  />
                  <select
                    name="currency"
                    value={formData.currency || 'USD'}
                    onChange={handleChange}
                    className="select"
                    style={{ width: '100px' }}
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="input-group">
                <label className="label">Purchase Place</label>
                <input
                  type="text"
                  name="purchase_place"
                  value={formData.purchase_place || ''}
                  onChange={handleChange}
                  className="input"
                  placeholder="Store or website"
                />
              </div>

              <div className="input-group">
                <label className="label">Warranty Expiry</label>
                <input
                  type="date"
                  name="warranty_expiry"
                  value={formData.warranty_expiry || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Item Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Item Details</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="input-group">
                <label className="label">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="input-group">
                <label className="label">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="input-group">
                <label className="label">Serial Number</label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="input-group">
                <label className="label">Total Uses</label>
                <input
                  type="number"
                  name="total_uses"
                  value={formData.total_uses || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="input-group">
                <label className="label">Uses Left</label>
                <input
                  type="number"
                  name="uses_left"
                  value={formData.uses_left || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Photos</h2>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <label className="btn btn-outline cursor-pointer">
                <Camera className="h-4 w-4" />
                Upload Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {formData.photos && formData.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Notes</h2>
          </div>
          <div className="card-body">
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              className="input"
              rows={4}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* QR Code */}
        {!isNew && id && (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold">QR Code</h2>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowQR(!showQR)}
              >
                <QrCode className="h-4 w-4" />
                {showQR ? 'Hide' : 'Show'} QR
              </button>
            </div>
            {showQR && (
              <div className="card-body flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateQRCodeData(id, formData.name || ''))}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <div>
            {!isNew && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Link to="/items" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
