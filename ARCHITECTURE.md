# OThings 技术架构文档

> **版本**: 1.0  
> **最后更新**: 2026-02-22

---

## 1. 技术栈概览

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  React 18.2+     │  TypeScript 5.x   │  Vite 5.x          │
│  React Router 7  │  React Query      │  CSS Modules       │
├─────────────────────────────────────────────────────────────┤
│                        Data                                 │
├─────────────────────────────────────────────────────────────┤
│  sql.js (SQLite)  │  Repository Pattern │  localStorage   │
├─────────────────────────────────────────────────────────────┤
│                        AI                                   │
├─────────────────────────────────────────────────────────────┤
│  MiniMax API (可选) │  OAuth 认证模式                      │
└─────────────────────────────────────────────────────────────┘
```

### 依赖清单

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.0.0",
    "sql.js": "^1.9.0",
    "lucide-react": "^0.300.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.0"
  }
}
```

---

## 2. 项目结构

### 2.1 目录架构

```
othings/
├── public/                      # 静态资源
│   └── sql-wasm.wasm           # sql.js WebAssembly
│
├── src/
│   ├── main.tsx                # 入口文件
│   ├── App.tsx                 # 路由配置
│   ├── index.css               # 全局样式
│   │
│   ├── features/               # 功能模块（核心）
│   │   ├── items/              # 物品管理
│   │   │   ├── components/    # 物品组件
│   │   │   │   ├── ItemList.tsx
│   │   │   │   ├── ItemCard.tsx
│   │   │   │   ├── ItemForm.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/          # 物品 hooks
│   │   │   │   └── useItems.ts
│   │   │   ├── services/       # 数据访问层
│   │   │   │   └── itemRepository.ts
│   │   │   ├── types.ts        # 类型定义
│   │   │   └── index.ts        # 导出
│   │   │
│   │   ├── categories/         # 分类管理
│   │   │   ├── components/
│   │   │   │   ├── CategoryList.tsx
│   │   │   │   ├── CategoryForm.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   └── useCategories.ts
│   │   │   ├── services/
│   │   │   │   └── categoryRepository.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── reminders/          # 提醒管理
│   │   │   ├── components/
│   │   │   │   ├── ReminderList.tsx
│   │   │   │   ├── ReminderItem.tsx
│   │   │   │   ├── ReminderForm.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   └── useReminders.ts
│   │   │   ├── services/
│   │   │   │   └── reminderRepository.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── search/             # 搜索功能
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   ├── services/
│   │   │   │   └── searchService.ts
│   │   │   ├── hooks/
│   │   │   │   └── useSearch.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── reports/            # 报表功能 (v1.1)
│   │   │   ├── components/
│   │   │   │   ├── Overview.tsx
│   │   │   │   └── Charts.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useReports.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── settings/           # 设置
│   │   │   ├── components/
│   │   │   │   └── SettingsForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSettings.ts
│   │   │   ├── services/
│   │   │   │   └── settingsRepository.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   └── import-export/      # 导入导出 (v1.1)
│   │       ├── components/
│   │       │   ├── ExportButton.tsx
│   │       │   ├── ImportButton.tsx
│   │       │   └── ImportPreview.tsx
│   │       ├── services/
│   │       │   └── importExportService.ts
│   │       └── index.ts
│   │
│   ├── shared/                 # 共享代码
│   │   ├── components/         # 通用组件
│   │   │   ├── Layout/
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   ├── Badge/
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/              # 通用 hooks
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/              # 工具函数
│   │   │   ├── format.ts       # 格式化
│   │   │   ├── validate.ts     # 验证
│   │   │   ├── date.ts         # 日期处理
│   │   │   └── index.ts
│   │   │
│   │   ├── types/              # 全局类型
│   │   │   ├── common.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── db/                 # 数据库核心
│   │   │   ├── index.ts        # 初始化
│   │   │   ├── schema.ts      # 表结构
│   │   │   └── migrations.ts  # 迁移
│   │   │
│   │   └── styles/             # 全局样式
│   │       ├── variables.css
│   │       └── index.css
│   │
│   └── pages/                  # 页面入口
│       ├── Dashboard.tsx
│       ├── Items.tsx
│       ├── Categories.tsx
│       ├── Reminders.tsx
│       ├── Reports.tsx
│       └── Settings.tsx
│
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── eslint.config.js
```

### 2.2 模块职责

| 模块 | 职责 | 导出 |
|------|------|------|
| `features/items` | 物品 CRUD | `useItems`, `ItemList`, `ItemForm` |
| `features/categories` | 分类管理 | `useCategories`, `CategoryList` |
| `features/reminders` | 提醒管理 | `useReminders`, `ReminderList` |
| `features/search` | 搜索功能 | `useSearch`, `SearchBar` |
| `features/settings` | 设置管理 | `useSettings`, `SettingsForm` |
| `shared/components` | 通用组件 | `Button`, `Input`, `Modal`, `Layout` |
| `shared/db` | 数据库 | `initDatabase`, `saveDatabase` |

---

## 3. 数据层架构

### 3.1 数据库初始化

```typescript
// src/shared/db/index.ts
import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;
  
  const SQL = await initSqlJs({
    locateFile: file => `/sql-wasm.wasm`
  });
  
  // 尝试从 localStorage 加载
  const saved = localStorage.getItem('othings-db');
  if (saved) {
    try {
      const data = new Uint8Array(JSON.parse(saved));
      db = new SQL.Database(data);
      console.log('[DB] Loaded from localStorage');
    } catch (e) {
      console.warn('[DB] Failed to load, creating new:', e);
      db = new SQL.Database();
      initSchema(db);
    }
  } else {
    db = new SQL.Database();
    initSchema(db);
    console.log('[DB] Created new database');
  }
  
  return db;
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  localStorage.setItem('othings-db', JSON.stringify(Array.from(data)));
}

// 自动保存：每次数据变更后保存
let saveTimeout: number | null = null;
export function scheduleSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(() => {
    saveDatabase();
    saveTimeout = null;
  }, 1000);
}
```

### 3.2 数据库表结构

```typescript
// src/shared/db/schema.ts
export function initSchema(db: Database): void {
  // 分类表
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6B7280',
      icon TEXT,
      parentId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (parentId) REFERENCES categories(id)
    )
  `);
  
  // 物品表
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      categoryId TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      purchasePrice REAL,
      purchaseDate TEXT,
      warrantyExpiry TEXT,
      customFields TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    )
  `);
  
  // 提醒表
  db.run(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      title TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completedAt TEXT,
      notifyBefore INTEGER NOT NULL DEFAULT 7,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
    )
  `);
  
  // 设置表
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  
  // 初始化默认设置
  const defaultSettings = [
    ['theme', 'system'],
    ['defaultView', 'grid'],
    ['itemsPerPage', '20'],
    ['searchMode', 'normal'],
    ['notifications', 'true']
  ];
  
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  defaultSettings.forEach(([key, value]) => stmt.run([key, value]));
  stmt.free();
}
```

### 3.3 Repository 接口

```typescript
// src/features/items/services/itemRepository.ts
import { v4 as uuidv4 } from 'uuid';
import { queryDatabase, saveDatabase, scheduleSave } from '@/shared/db';
import type { Item, CreateItemInput, UpdateItemInput, ItemFilters } from '../types';

export interface ItemRepository {
  findAll(filters?: ItemFilters): Promise<Item[]>;
  findById(id: string): Promise<Item | null>;
  create(input: CreateItemInput): Promise<Item>;
  update(id: string, data: UpdateItemInput): Promise<Item>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
  search(query: string): Promise<Item[]>;
  count(filters?: ItemFilters): Promise<number>;
}

export const itemRepository: ItemRepository = {
  async findAll(filters) {
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.categoryId) {
      sql += ' AND categoryId = ?';
      params.push(filters.categoryId);
    }
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR location LIKE ?)';
      const pattern = `%${filters.search}%`;
      params.push(pattern, pattern, pattern);
    }
    
    sql += ' ORDER BY updatedAt DESC';
    
    if (filters?.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }
    
    return queryDatabase<Item>(sql, params);
  },
  
  async findById(id) {
    const items = await queryDatabase<Item>(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );
    return items[0] || null;
  },
  
  async create(input) {
    const now = new Date().toISOString();
    const item: Item = {
      id: uuidv4(),
      name: input.name,
      categoryId: input.categoryId || null,
      quantity: input.quantity ?? 1,
      description: input.description || null,
      location: input.location || null,
      status: input.status || 'active',
      purchasePrice: input.purchasePrice || null,
      purchaseDate: input.purchaseDate || null,
      warrantyExpiry: input.warrantyExpiry || null,
      customFields: input.customFields || null,
      createdAt: now,
      updatedAt: now
    };
    
    await queryDatabase(
      `INSERT INTO items (id, name, categoryId, quantity, description, location, 
        status, purchasePrice, purchaseDate, warrantyExpiry, customFields, 
        createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.name, item.categoryId, item.quantity, item.description,
       item.location, item.status, item.purchasePrice, item.purchaseDate,
       item.warrantyExpiry, item.customFields ? JSON.stringify(item.customFields) : null,
       item.createdAt, item.updatedAt]
    );
    
    scheduleSave();
    return item;
  },
  
  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Item ${id} not found`);
    
    const updated: Item = {
      ...existing,
      ...data,
      id: existing.id, // 不可修改
      createdAt: existing.createdAt, // 不可修改
      updatedAt: new Date().toISOString()
    };
    
    await queryDatabase(
      `UPDATE items SET name=?, categoryId=?, quantity=?, description=?, 
        location=?, status=?, purchasePrice=?, purchaseDate=?, warrantyExpiry=?, 
        customFields=?, updatedAt=? WHERE id=?`,
      [updated.name, updated.categoryId, updated.quantity, updated.description,
       updated.location, updated.status, updated.purchasePrice, updated.purchaseDate,
       updated.warrantyExpiry, 
       updated.customFields ? JSON.stringify(updated.customFields) : null,
       updated.updatedAt, id]
    );
    
    scheduleSave();
    return updated;
  },
  
  async delete(id) {
    await queryDatabase('DELETE FROM items WHERE id = ?', [id]);
    scheduleSave();
  },
  
  async deleteMany(ids) {
    const placeholders = ids.map(() => '?').join(',');
    await queryDatabase(`DELETE FROM items WHERE id IN (${placeholders})`, ids);
    scheduleSave();
  },
  
  async search(query) {
    const pattern = `%${query}%`;
    return queryDatabase<Item>(
      `SELECT * FROM items WHERE name LIKE ? OR description LIKE ? OR location LIKE ? 
       ORDER BY updatedAt DESC LIMIT 50`,
      [pattern, pattern, pattern]
    );
  },
  
  async count(filters) {
    let sql = 'SELECT COUNT(*) as count FROM items WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.categoryId) {
      sql += ' AND categoryId = ?';
      params.push(filters.categoryId);
    }
    if (filters?.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    
    const result = await queryDatabase<{count: number}>(sql, params);
    return result[0]?.count || 0;
  }
};
```

---

## 4. 状态管理

### 4.1 React Query 配置

```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟内数据视为新鲜
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);
```

### 4.2 自定义 Hooks

```typescript
// src/features/items/hooks/useItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemRepository, type ItemFilters } from '../services/itemRepository';

export function useItems(filters?: ItemFilters) {
  return useQuery({
    queryKey: ['items', filters],
    queryFn: () => itemRepository.findAll(filters)
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => itemRepository.findById(id),
    enabled: !!id
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: itemRepository.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      itemRepository.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', id] });
    }
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: itemRepository.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
}
```

---

## 5. 路由结构

```typescript
// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/shared/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Items } from '@/pages/Items';
import { Categories } from '@/pages/Categories';
import { Reminders } from '@/pages/Reminders';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="items" element={<Items />} />
        <Route path="categories" element={<Categories />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
```

---

## 6. LLM 搜索 (v1.1)

### 6.1 服务接口

```typescript
// src/features/search/services/llmSearch.ts
interface LLMSearchOptions {
  query: string;
  items: Item[];
  filters?: ItemFilters;
  limit?: number;
}

interface SearchResult {
  items: Item[];
  relevance: number;
  summary?: string;
}

export async function llmSearch(options: LLMSearchOptions): Promise<SearchResult> {
  const { query, items, filters, limit = 20 } = options;
  
  // 构建 prompt
  const itemList = items.map(i => 
    `- ${i.name}: ${i.description || '无描述'}, 分类: ${i.categoryId || '未分类'}, 位置: ${i.location || '未知'}`
  ).join('\n');
  
  const prompt = `你是一个物品管理助手。用户想找: "${query}"

现有物品列表:
${itemList}

请找出最相关的物品，返回物品名称列表（用逗号分隔），并简要说明理由。

返回格式:
物品: [名称1, 名称2, ...]
理由: [简短说明]`;

  // 调用 MiniMax API
  const response = await fetch('/api/llm/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  
  const result = await response.json();
  
  // 解析结果，匹配物品
  const matchedNames = parseLLMResponse(result.text);
  const matchedItems = items.filter(i => matchedNames.includes(i.name));
  
  return {
    items: matchedItems.slice(0, limit),
    relevance: matchedItems.length / Math.max(matchedNames.length, 1),
    summary: result.summary
  };
}
```

---

## 7. 构建与部署

### 7.1 Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000
  }
});
```

### 7.2 部署

```bash
# 构建
npm run build

# 预览
npm run preview

# 部署到静态托管
# 支持: Vercel, Netlify, Cloudflare Pages, GitHub Pages 等
```

---

## 8. 待定事项

| 事项 | 优先级 | 备注 |
|------|--------|------|
| 样式方案选择 | 高 | CSS Modules 已采用 |
| 测试方案 | 中 | Vitest + Testing Library |
| PWA 支持 | 低 | 后续考虑 |
| SSR/SSG | 低 | 暂无需求 |

---

## 9. 参考资料

- [React 文档](https://react.dev)
- [React Query](https://tanstack.com/query)
- [sql.js](https://sql.js.org)
- [Vite](https://vitejs.dev)
- [Repository Pattern](https://docs.microsoft.com/en-us/aspnet/mvc/overview/older-versions/getting-started-with-ef-5-using-mvc-4/implementing-the-repository-and-unit-of-work-patterns-in-an-asp-net-mvc-application)

---

**文档版本**: 1.0  
**最后更新**: 2026-02-22
