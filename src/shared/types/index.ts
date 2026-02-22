// OThings - Type Definitions

// ==================== Item ====================
export interface Item {
  id: string;
  name: string;
  categoryId: string | null;
  quantity: number;
  
  // Details
  description?: string;
  location?: string;
  status: ItemStatus;
  purchasePrice?: number;
  purchaseDate?: string; // YYYY-MM-DD
  warrantyExpiry?: string; // YYYY-MM-DD
  
  // Custom Fields
  customFields?: Record<string, string | number | boolean>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type ItemStatus = 'active' | 'inactive' | 'discarded';

export interface CreateItemInput {
  name: string;
  categoryId?: string | null;
  quantity?: number;
  description?: string;
  location?: string;
  status?: ItemStatus;
  purchasePrice?: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  customFields?: Record<string, string | number | boolean>;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {
  id: string;
}

export interface ItemFilters {
  search?: string;
  categoryId?: string | null;
  status?: ItemStatus | null;
  location?: string;
}

// ==================== Category ====================
export interface Category {
  id: string;
  name: string;
  color: string; // hex
  icon?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  color: string;
  icon?: string;
  parentId?: string;
}

// ==================== Reminder ====================
export interface Reminder {
  id: string;
  itemId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  notifyBefore: number; // 天数
  createdAt: string;
  updatedAt: string;
}

export type ReminderStatus = 'overdue' | 'upcoming' | 'completed';

export interface CreateReminderInput {
  itemId: string;
  title: string;
  dueDate: string;
  notifyBefore?: number;
}

// ==================== Settings ====================
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'grid' | 'list';
  itemsPerPage: number;
  searchMode: 'normal' | 'llm';
  llmProvider: string;
  notifications: boolean;
}

export const defaultSettings: Settings = {
  theme: 'system',
  defaultView: 'list',
  itemsPerPage: 20,
  searchMode: 'normal',
  llmProvider: '',
  notifications: true,
};

// ==================== Import/Export ====================
export interface ExportData {
  schemaVersion: 'v1';
  exportedAt: string;
  items: Item[];
  categories: Category[];
  reminders: Reminder[];
}

export interface PreflightResult {
  newItems: number;
  newCategories: number;
  newReminders: number;
  conflicts: number;
  errors: string[];
}

// ==================== Dashboard Stats ====================
export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  newItemsThisMonth: number;
  reminders: {
    overdue: number;
    upcoming: number;
    completed: number;
  };
}

// ==================== API Response ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
