# OThings - 技术架构文档

## 1. 技术栈

| 层级 | 技术选型 |
|------|----------|
| 构建工具 | Vite |
| 框架 | React 18 + TypeScript |
| 路由 | React Router v7 |
| 状态管理 | React Query + React Context |
| 数据库 | sql.js (SQLite in browser) |
| 样式 | CSS Modules 或 Tailwind (待定) |
| LLM 调用 | MiniMax API (OAuth 模式) |

## 2. 项目结构 (Feature-First)

```
src/
├── features/                 # 功能模块 (核心)
│   ├── items/               # 物品管理
│   │   ├── components/      # 物品相关组件
│   │   ├── hooks/           # 物品相关 hooks
│   │   ├── services/        # 物品 API (Repository)
│   │   ├── types.ts         # 类型定义
│   │   └── index.ts         # 导出
│   ├── categories/         # 分类管理
│   ├── reminders/          # 提醒管理
│   ├── reports/            # 报表
│   ├── settings/           # 设置
│   └── search/             # 搜索 (含 LLM)
│
├── shared/                  # 共享代码
│   ├── components/         # 通用组件 (Layout, Button, Modal...)
│   ├── hooks/              # 通用 hooks
│   ├── utils/             # 工具函数
│   ├── types/             # 全局类型
│   └── db/                # 数据库核心 (sql.js 初始化)
│
├── pages/                   # 页面入口
│   ├── Dashboard.tsx
│   ├── Items.tsx
│   ├── Categories.tsx
│   ├── Reminders.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
│
├── App.tsx                 # 路由配置
├── main.tsx               # 入口
└── index.css              # 全局样式
```

## 3. 数据层 (Repository Pattern)

### 3.1 数据库初始化

```typescript
// shared/db/index.ts
import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;
  
  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
  
  // 从 localStorage 加载或创建新 DB
  const saved = localStorage.getItem('othings-db');
  if (saved) {
    db = new SQL.Database(new Uint8Array(JSON.parse(saved)));
  } else {
    db = new SQL.Database();
    initSchema(db);
  }
  
  return db;
}

export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  localStorage.setItem('othings-db', JSON.stringify(Array.from(data)));
}
```

### 3.2 Repository 接口

```typescript
// features/items/services/itemRepository.ts
export interface ItemRepository {
  findAll(filters?: ItemFilters): Promise<Item[]>;
  findById(id: string): Promise<Item | null>;
  create(item: CreateItemInput): Promise<Item>;
  update(id: string, data: UpdateItemInput): Promise<Item>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Item[]>;
  count(filters?: ItemFilters): Promise<number>;
}

// 类似地定义 CategoryRepository, ReminderRepository
```

## 4. 数据模型

### 4.1 Item

```typescript
interface Item {
  id: string;                    // UUID
  name: string;                  // 必填
  categoryId: string | null;    // 外键
  quantity: number;              // 默认 1
  
  // Details
  description?: string;
  location?: string;
  status: 'active' | 'inactive' | 'discarded';
  purchasePrice?: number;
  purchaseDate?: string;        // YYYY-MM-DD
  warrantyExpiry?: string;      // YYYY-MM-DD
  
  // Custom Fields
  customFields?: Record<string, string | number | boolean>;
  
  // Timestamps
  createdAt: string;             // ISO
  updatedAt: string;             // ISO
}
```

### 4.2 Category

```typescript
interface Category {
  id: string;
  name: string;
  color: string;                 // hex
  icon?: string;
  parentId?: string;             // 可选二级分类
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 Reminder

```typescript
interface Reminder {
  id: string;
  itemId: string;
  title: string;
  dueDate: string;               // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;         // ISO
  notifyBefore: number;          // 天数
  createdAt: string;
  updatedAt: string;
}
```

### 4.4 Settings

```typescript
interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'grid' | 'list';
  itemsPerPage: number;
  searchMode: 'normal' | 'llm';
  llmProvider: string;
  notifications: boolean;
}
```

## 5. 路由结构

```typescript
// App.tsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Dashboard />} />
    <Route path="items" element={<Items />} />
    <Route path="categories" element={<Categories />} />
    <Route path="reminders" element={<Reminders />} />
    <Route path="reports" element={<Reports />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

## 6. 关键模块设计

### 6.1 Search (搜索)

| 模式 | 实现 |
|------|------|
| Normal | SQL LIKE 查询 |
| LLM | 调用 MiniMax API，语义搜索 |

```typescript
// features/search/services/searchService.ts
interface SearchService {
  normalSearch(query: string, filters?: Filters): Promise<Item[]>;
  llmSearch(query: string, filters?: Filters): Promise<Item[]>;
  // 并发控制：只保留最新请求
}
```

### 6.2 Import/Export

```typescript
// JSON 导出格式 (v1)
interface ExportData {
  schemaVersion: 'v1';
  exportedAt: string;
  items: Item[];
  categories: Category[];
  reminders: Reminder[];
}

// Import 流程
async function preflightImport(data: ExportData): Promise<PreflightResult> {
  // 返回: 新增数、冲突数、丢弃数、错误数
}

async function commitImport(data: ExportData): Promise<void> {
  // 执行实际导入
}
```

### 6.3 Reminders (提醒)

```typescript
// 状态判断 (基于本地时区)
function getReminderStatus(reminder: Reminder): 'overdue' | 'upcoming' | 'completed' {
  if (reminder.completed) return 'completed';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(reminder.dueDate);
  due.setHours(0, 0, 0, 0);
  
  if (due < today) return 'overdue';
  if (due <= today + reminder.notifyBefore * 24 * 60 * 60 * 1000) return 'upcoming';
  return 'completed'; // 不在 upcoming 范围内也算 completed
}
```

## 7. 待定事项

| # | 事项 | 备注 |
|---|------|------|
| 1 | 样式方案 | CSS Modules / Tailwind？ |
| 2 | 状态管理 | React Query 够用吗？需要 Redux/Zustand？ |
| 3 | LLM 调用 | MiniMax 具体用哪个模型？ |
| 4 | 测试方案 | Vitest + Testing Library？ |

## 8. 开发优先级

1. **Phase 1: 基础骨架**
   - 项目结构搭建
   - 数据库初始化 + Schema
   - 路由配置
   
2. **Phase 2: 核心功能**
   - Items CRUD
   - Categories 管理
   - Reminders
   
3. **Phase 3: 增强功能**
   - Search (Normal + LLM)
   - Reports
   - Import/Export
   
4. **Phase 4: 完善**
   - Settings
   - 样式美化
   - 性能优化
