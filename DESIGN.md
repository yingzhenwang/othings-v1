# OThings - Design System

## 1. 设计原则

- **简洁克制** - 少即是多，去除冗余装饰
- **功能优先** - 每一个元素都有其目的
- **高效交互** - 减少操作步骤，快速达成目标
- **一致性** - 统一的设计语言

## 2. 色彩系统

### 2.1 主色 (Primary)

```css
:root {
  /* 核心色 - 深邃克制的蓝黑色 */
  --color-primary: #1a1d23;
  --color-primary-hover: #2a2e38;
  
  /* 强调色 - 优雅的琥珀金 */
  --color-accent: #c9a55c;
  --color-accent-hover: #d4b46d;
  
  /* 背景色 - 低饱和度灰白 */
  --color-bg-primary: #f8f9fa;
  --color-bg-secondary: #ffffff;
  --color-bg-tertiary: #f1f3f5;
  
  /* 文字色 - 不同层级的灰 */
  --color-text-primary: #1a1d23;
  --color-text-secondary: #5c5f66;
  --color-text-tertiary: #909296;
  --color-text-inverse: #ffffff;
  
  /* 边框色 */
  --color-border: #e9ecef;
  --color-border-hover: #dee2e6;
  
  /* 状态色 - 克制而清晰 */
  --color-success: #2d8a5e;
  --color-warning: #c9a55c;
  --color-danger: #c94a4a;
  --color-info: #4a6fa5;
  
  /* 语义色 */
  --color-reminder-overdue: #c94a4a;
  --color-reminder-upcoming: #c9a55c;
  --color-reminder-completed: #2d8a5e;
}
```

### 2.2 暗色模式

```css
[data-theme="dark"] {
  --color-primary: #e9ecef;
  --color-primary-hover: #f8f9fa;
  
  --color-accent: #d4b46d;
  --color-accent-hover: #e0c080;
  
  --color-bg-primary: #0d1117;
  --color-bg-secondary: #161b22;
  --color-bg-tertiary: #21262d;
  
  --color-text-primary: #e9ecef;
  --color-text-secondary: #8b949e;
  --color-text-tertiary: #6e7681;
  --color-text-inverse: #0d1117;
  
  --color-border: #30363d;
  --color-border-hover: #484f58;
}
```

## 3. 字体系统

```css
:root {
  /* 字体 - 系统字体 + 中文优化 */
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --font-mono: "SF Mono", "Fira Code", "JetBrains Mono", monospace;
  
  /* 字重 */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* 字号 - 克制而有序 */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.8125rem;  /* 13px */
  --font-size-base: 0.875rem; /* 14px */
  --font-size-md: 1rem;       /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 2rem;      /* 32px */
  
  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

## 4. 间距系统

```css
:root {
  /* 基础间距 - 4px 网格 */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

## 5. 组件规范

### 5.1 按钮 (Button)

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}
.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}
.btn-secondary:hover {
  border-color: var(--color-border-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
.btn-ghost:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.btn-accent {
  background: var(--color-accent);
  color: var(--color-primary);
}
.btn-accent:hover {
  background: var(--color-accent-hover);
}

/* 尺寸 */
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-lg { padding: var(--space-3) var(--space-6); font-size: var(--font-size-base); }
```

### 5.2 输入框 (Input)

```css
.input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(201, 165, 92, 0.15);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}
```

### 5.3 卡片 (Card)

```css
.card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--space-4);
}

.card-hover {
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.card-hover:hover {
  border-color: var(--color-border-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

### 5.4 列表项 (ListItem)

```css
.list-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  transition: background 0.15s ease;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background: var(--color-bg-tertiary);
}
```

### 5.5 标签 (Tag)

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: 4px;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.tag-active { background: #e8f5e9; color: var(--color-success); }
.tag-inactive { background: #fff3e0; color: var(--color-warning); }
.tag-discarded { background: #ffebee; color: var(--color-danger); }
```

### 5.6 状态徽章 (Badge)

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: 9999px;
}

.badge-overdue {
  background: rgba(201, 74, 74, 0.1);
  color: var(--color-reminder-overdue);
}

.badge-upcoming {
  background: rgba(201, 165, 92, 0.1);
  color: var(--color-reminder-upcoming);
}

.badge-completed {
  background: rgba(45, 138, 94, 0.1);
  color: var(--color-reminder-completed);
}
```

## 6. 布局规范

### 6.1 侧边栏布局

```
+------------------+--------------------------------+
|     Sidebar      |          Main Content          |
|     (240px)      |           (flex-1)             |
|                  |                                |
|  - Logo          |  +------------------------+   |
|  - Navigation    |  |     Page Header        |   |
|    - Dashboard   |  +------------------------+   |
|    - Items       |  |                        |   |
|    - Categories  |  |     Page Content      |   |
|    - Reminders   |  |                        |   |
|    - Reports     |  |                        |   |
|    - Settings    |  +------------------------+   |
|                  |                                |
+------------------+--------------------------------+
```

### 6.2 响应式断点

```css
/* Mobile First */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;

/* 
 * mobile: < 768px (侧边栏折叠为底部导航)
 * tablet: 768px - 1024px (侧边栏可折叠)
 * desktop: > 1024px (完整侧边栏)
 */
```

## 7. 动画

```css
:root {
  --transition-fast: 0.1s ease;
  --transition-normal: 0.15s ease;
  --transition-slow: 0.3s ease;
  
  --fade-in: fade-in 0.2s ease;
  --slide-up: slide-up 0.2s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { 
    opacity: 0;
    transform: translateY(8px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 8. 阴影

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
}
```

## 9. 图标

使用 **Lucide React** 图标库：
- 简洁现代
- 一致的线条粗细
- 完整的中文支持

常用图标：
- `Home`, `Package`, `Folder`, `Bell`, `BarChart3`, `Settings`
- `Plus`, `Search`, `Edit`, `Trash2`, `Check`, `X`
- `ChevronRight`, `ChevronDown`, `Menu`
- `Sun`, `Moon`, `Download`, `Upload`

## 10. 表单规范

### 必填标记
- 必填字段用 `*` 表示，放置在标签后
- 颜色：`var(--color-danger)`

### 错误状态
- 边框：`var(--color-danger)`
- 错误提示：红色小字，在输入框下方

### 布局
- 标签：左对齐，置于输入框上方
- 间距：标签与输入框 `var(--space-2)`

---

**版本**: v1.0  
**更新**: 2026-02-22
