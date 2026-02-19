import { useState, useEffect, useCallback } from 'react';
import { Item, Category, Reminder, AppSettings } from '../types';
import * as db from '../services/database';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    setItems(db.getAllItems());
  }, []);

  const refresh = useCallback(() => {
    setItems(db.getAllItems());
  }, []);

  return { items, refresh };
}

export function useItemsPaginated(page: number = 1, pageSize: number = 20) {
  const [result, setResult] = useState<db.PaginatedResult<Item>>({
    data: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
  });

  useEffect(() => {
    setResult(db.getItemsPaginated(page, pageSize));
  }, [page, pageSize]);

  const refresh = useCallback(() => {
    setResult(db.getItemsPaginated(page, pageSize));
  }, [page, pageSize]);

  return { ...result, refresh };
}

export function useItem(id: string) {
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    setItem(db.getItemById(id));
  }, [id]);

  const refresh = useCallback(() => {
    setItem(db.getItemById(id));
  }, [id]);

  return { item, refresh };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setCategories(db.getAllCategories());
  }, []);

  const refresh = useCallback(() => {
    setCategories(db.getAllCategories());
  }, []);

  return { categories, refresh };
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    setReminders(db.getAllReminders());
  }, []);

  const refresh = useCallback(() => {
    setReminders(db.getAllReminders());
  }, []);

  return { reminders, refresh };
}

export function useRemindersForItem(itemId: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    setReminders(db.getRemindersForItem(itemId));
  }, [itemId]);

  const refresh = useCallback(() => {
    setReminders(db.getRemindersForItem(itemId));
  }, [itemId]);

  return { reminders, refresh };
}

export function useSettings() {
  const [settings, setSettings] = useState<Partial<AppSettings>>({});

  useEffect(() => {
    setSettings(db.getSettings());
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    db.saveSettings(newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return { settings, updateSettings };
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    if (savedTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
    } else {
      setTheme(savedTheme as 'light' | 'dark');
    }
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      const savedTheme = localStorage.getItem('theme') || 'system';
      if (savedTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(isDark ? 'dark' : 'light');
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return theme;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useStats() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    itemsByCondition: {} as Record<string, number>,
    itemsByCategory: {} as Record<string, number>,
    itemsByLocation: {} as Record<string, number>,
    itemsAddedThisMonth: 0,
    upcomingReminders: [] as Reminder[],
    overdueReminders: [] as Reminder[],
  });

  useEffect(() => {
    setStats({
      totalItems: db.getItemCount(),
      totalValue: db.getTotalValue(),
      itemsByCondition: db.getItemsByCondition().reduce((acc, item) => {
        acc[item.condition] = item.count;
        return acc;
      }, {} as Record<string, number>),
      itemsByCategory: db.getItemsByCategory().reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {} as Record<string, number>),
      itemsByLocation: db.getItemsByLocation().reduce((acc, item) => {
        acc[item.location] = item.count;
        return acc;
      }, {} as Record<string, number>),
      itemsAddedThisMonth: db.getItemsAddedThisMonth(),
      upcomingReminders: db.getUpcomingReminders(7),
      overdueReminders: db.getUpcomingReminders(0).filter(r => new Date(r.due_date) < new Date()),
    });
  }, []);

  const refresh = useCallback(() => {
    setStats({
      totalItems: db.getItemCount(),
      totalValue: db.getTotalValue(),
      itemsByCondition: db.getItemsByCondition().reduce((acc, item) => {
        acc[item.condition] = item.count;
        return acc;
      }, {} as Record<string, number>),
      itemsByCategory: db.getItemsByCategory().reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {} as Record<string, number>),
      itemsByLocation: db.getItemsByLocation().reduce((acc, item) => {
        acc[item.location] = item.count;
        return acc;
      }, {} as Record<string, number>),
      itemsAddedThisMonth: db.getItemsAddedThisMonth(),
      upcomingReminders: db.getUpcomingReminders(7),
      overdueReminders: db.getUpcomingReminders(0).filter(r => new Date(r.due_date) < new Date()),
    });
  }, []);

  return { stats, refresh };
}
