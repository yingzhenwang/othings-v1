# OThings - Stuff Manager PRD

## 1. 产品定位

| 属性 | 值 |
|------|-----|
| 产品名称 | OThings (原 Stuff Manager) |
| 目标用户 | Single-user（个人用户） |
| 核心模式 | Local-first（本地优先） |
| 平台 | Desktop + Mobile Web（现代浏览器） |
| 数据引擎 | SQLite via sql.js |

## 2. 目标与非目标

### 2.1 Goals (Phase 1)

1. 用最短路径完成 `Add / Find / Update / Delete items`
2. 在 10k items 规模下保持可用性能（列表、过滤、搜索响应稳定）
3. 提供可靠 reminders（date-only，本地日历日语义）
4. 提供可解释、可恢复的数据导入导出（schemaVersion v1）
5. 建立可维护架构：`Feature-first + Repository + typed contracts`

### 2.2 Non-Goals (Phase 1)

1. 旧版本数据兼容迁移（clean break）
2. QR 相关流程（生成/扫描）和照片上传流程
3. 高级 analytics 与复杂 BI 报表
4. Telemetry/analytics 默认采集
5. 本地数据库加密能力

## 3. 用户画像与关键场景

### 3.1 用户画像

- 个人用户，管理家庭/个人资产
- 主要在桌面端使用，移动端以查询为主

### 3.2 关键场景 (Top Scenarios)

1. 快速录入物品（名称、分类、数量、位置、状态）
2. 按关键字/分类/位置筛选并定位物品
3. 管理保修/维护提醒，避免过期
4. 导出备份，导入恢复（仅 v1 格式）

## 4. 功能范围

### 4.1 In Scope (Phase 1)

| 模块 | 功能 |
|------|------|
| Items CRUD | 平衡字段模型：core + details + custom key-value |
| Categories | 分类管理 |
| Reminders | date-only + Browser Notification |
| Search | Normal 默认；LLM 为可选高级功能 |
| Reports | Operational summaries（库存数量、价值、提醒概览） |
| Import/Export | JSON 导入导出 + CSV 导出 |
| Settings | theme / defaultView / itemsPerPage / searchMode / llmProvider / notifications |

### 4.2 Out of Scope

1. QR 流程
2. Photos 上传
3. 旧格式兼容与迁移工具
4. CSV 导入（Phase 2 候选）

## 5. 信息架构

```
/
├── Dashboard      # 首页/概览
├── Items         # 物品管理
├── Categories    # 分类管理
├── Reminders     # 提醒管理
├── Reports       # 报表
└── Settings      # 设置
```

## 6. 关键需求细节

### 6.1 Item 数据模型

**Core Fields (必填)**
- `id`: string (UUID)
- `name`: string
- `categoryId`: string | null
- `quantity`: number (default: 1)
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

**Details Fields (可选)**
- `description`: string
- `location`: string
- `status`: 'active' | 'inactive' | 'discarded'
- `purchasePrice`: number | null
- `purchaseDate`: YYYY-MM-DD | null
- `warrantyExpiry`: YYYY-MM-DD | null

**Custom Fields**
- `customFields`: Record<string, string | number | boolean>

### 6.2 Category 数据模型

```typescript
interface Category {
  id: string;
  name: string;
  color: string; // hex
  icon?: string;
  parentId?: string; // 支持二级分类
  createdAt: string;
  updatedAt: string;
}
```

### 6.3 Reminder 数据模型

```typescript
interface Reminder {
  id: string;
  itemId: string;
  title: string;
  dueDate: YYYY-MM-DD; // date-only
  completed: boolean;
  completedAt?: ISO timestamp;
  notifyBefore: number; // 天数
  createdAt: string;
  updatedAt: string;
}
```

**Reminder 状态判断**
- `overdue`: dueDate < today (local start-of-day)
- `upcoming`: dueDate >= today && dueDate <= today + notifyBefore
- `completed`: completed = true
- upcoming 与 overdue 互斥

### 6.4 Search

| 模式 | 描述 |
|------|------|
| Normal Search | 关键字匹配 name/description/location |
| LLM Search | 显式切换；失败必须用户可见；并发请求只保留最新响应 |

**LLM Search 要求**
- 必须先有 normal search 可用
- 错误需要 toast/alert 展示给用户
- 并发请求只保留最新响应，cancel 旧的

### 6.5 Import/Export

**JSON 格式 (v1)**
```json
{
  "schemaVersion": "v1",
  "exportedAt": "ISO timestamp",
  "items": [...],
  "categories": [...],
  "reminders": [...]
}
```

**Import 流程**
1. **Preflight**: 解析并校验，返回新增/冲突/丢弃/错误数量
2. **Commit**: 确认后执行导入
3. schemaVersion 不匹配拒绝导入

**CSV 导出**
- 仅支持 items
- 固定字段：name, category, quantity, location, status, description, purchasePrice, purchaseDate

### 6.6 Settings

| 设置项 | 类型 | 默认值 |
|--------|------|--------|
| theme | 'light' \| 'dark' \| 'system' | 'system' |
| defaultView | 'grid' \| 'list' | 'list' |
| itemsPerPage | number | 20 |
| searchMode | 'normal' \| 'llm' | 'normal' |
| llmProvider | string | '' |
| notifications | boolean | true |

**要求**
- 强类型序列化/反序列化
- 保存后无需整页 reload 即生效

### 6.7 Reports 指标定义

| 指标 | 计算方式 |
|------|----------|
| 总物品数 | SUM(items.quantity) |
| 总价值 | SUM(items.quantity * items.purchasePrice)，仅统计 price 有效项 |
| 当月新增 | 当前本地自然月内 createdAt 的 item 数量 |
| 提醒概览 | upcoming / overdue / completed 三类计数 |

### 6.8 Performance SLO (10k items)

| 操作 | P95 目标 |
|------|----------|
| 首屏进入 Items 页面 | <= 2.0s |
| 切换分页 | <= 300ms |
| 普通搜索 | <= 400ms |
| 筛选组合变更 | <= 400ms |
| 单次同步阻塞主线程 | <= 100ms |

## 7. 错误处理

| 场景 | 处理 |
|------|------|
| DB init 失败 | 进入 initError 状态，提供 Retry 按钮 |
| LLM 失败 | 可见 error toast，不影响 normal search |
| Import schemaVersion 不匹配 | 拒绝并提示用户 |
| Import commit 产生 orphan reminders | 回滚并报错 |

## 8. 安全基线

1. LLM API Key 不持久化到 localStorage/IndexedDB
2. 无默认 telemetry 采集
3. 数据存储在用户本地

## 9. 发布门槛 (Definition of Done)

- [ ] DB init 失败可进入 initError 并 Retry 恢复
- [ ] LLM 失败可见且不影响 normal search
- [ ] Import 满足 preflight -> commit，schemaVersion 不匹配拒绝导入
- [ ] commit 不产生 orphan reminders
- [ ] 文档与实现一致
- [ ] 核心验收用例通过
- [ ] Build 通过且无 blocker 级漏洞

## 10. 待确认问题

### 10.1 需要确认

1. **LLM Provider**: Phase 1 支持哪些？MiniMax？OpenAI？
2. **Custom Fields**: 有无预定义模板，还是完全自定义？
3. **分类层级**: 支持到二级还是无限？
4. **多语言**: Phase 1 只支持英语，还是需要 i18n？
5. **数据存储**: 除了 sql.js，是否考虑 IndexedDB？或者只依赖 sql.js？
6. **通知机制**: Browser Notification 是否足够？需要 email 提醒吗？
7. **离线支持**: PWA 离线模式需要吗？

### 10.2 可选增强 (后续版本)

- [ ] 多语言 (i18n)
- [ ] PWA / 离线模式
- [ ] 照片上传
- [ ] QR 扫描/生成
- [ ] CSV 导入
- [ ] 数据加密

---

**文档版本**: v1.0  
**最后更新**: 2026-02-22
