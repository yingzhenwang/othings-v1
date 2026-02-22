# OThings 更新日志

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-22

### ✨ 新增

**物品管理**
- 物品列表页面（网格/列表视图）
- 添加物品功能（完整字段支持）
- 编辑物品功能
- 删除物品（单个/批量）
- 物品状态管理（active/inactive/discarded）
- 自定义字段支持

**分类管理**
- 分类列表页面
- 创建分类（名称、颜色、图标）
- 二级分类支持
- 编辑/删除分类

**提醒功能**
- 提醒列表页面（按状态分组）
- 创建提醒（关联物品、到期日）
- 自动状态计算（已过期/即将到期/已完成）
- 提前提醒设置

**搜索**
- 关键词搜索（名称、描述、位置）
- 实时搜索

**设置**
- 主题切换（浅色/深色/系统）
- 默认视图设置
- 每页显示数量
- 搜索模式切换

### 🏗️ 架构

- React 18 + TypeScript
- Vite 构建工具
- React Router v7
- sql.js (SQLite in browser)
- Repository 模式
- React Query 状态管理

### 🎨 设计

- 完整设计系统文档
- 响应式布局（桌面/平板/手机）
- 暗色模式支持

---

## [0.9.0] - 2026-02-11

### 🧪 内部测试版

- 项目初始化
- 技术选型验证
- 原型开发

---

## 待定功能

### v1.1.0
- [ ] LLM 语义搜索
- [ ] 数据报表（资产总览、分类分布）
- [ ] 导入/导出功能

### v2.0.0
- [ ] 多设备同步
- [ ] 高级筛选
- [ ] 批量操作
- [ ] 条码扫描

---

## 如何贡献

如果你发现了 bug 或有新功能建议，请提交 [Issue](https://github.com/yingzhenwang/othings/issues)。

---

*此日志遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 标准*
