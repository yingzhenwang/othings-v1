export type Condition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';

export type ReminderType = 'Warranty expiry' | 'Maintenance' | 'Replacement' | 'Custom';

export interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  quantity: number;
  location: string;
  condition: Condition;
  uses_left: number | null;
  total_uses: number | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency: string;
  purchase_place: string;
  warranty_expiry: string | null;
  brand: string;
  model: string;
  serial_number: string;
  notes: string;
  photos: string[];
  qr_code: string;
  custom_fields: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  is_custom: boolean;
  parent_id: string | null;
}

export interface Reminder {
  id: string;
  item_id: string;
  type: ReminderType;
  due_date: string;
  message: string;
  is_completed: boolean;
  repeat: string | null;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'grid' | 'list';
  itemsPerPage: number;
  searchMode: 'normal' | 'llm';
  llmProvider: 'openai' | 'anthropic' | 'ollama';
  llmApiKey: string;
  notificationsEnabled: boolean;
  notificationTiming: number;
  dataFilePath: string | null;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Electronics', icon: 'Laptop', is_custom: false, parent_id: null },
  { name: 'Furniture', icon: 'Sofa', is_custom: false, parent_id: null },
  { name: 'Clothing', icon: 'Shirt', is_custom: false, parent_id: null },
  { name: 'Books', icon: 'BookOpen', is_custom: false, parent_id: null },
  { name: 'Tools', icon: 'Wrench', is_custom: false, parent_id: null },
  { name: 'Kitchen', icon: 'UtensilsCrossed', is_custom: false, parent_id: null },
  { name: 'Sports', icon: 'Dumbbell', is_custom: false, parent_id: null },
  { name: 'Art', icon: 'Palette', is_custom: false, parent_id: null },
  { name: 'Collectibles', icon: 'Trophy', is_custom: false, parent_id: null },
  { name: 'Documents', icon: 'FileText', is_custom: false, parent_id: null },
  { name: 'Other', icon: 'Package', is_custom: false, parent_id: null },
];
