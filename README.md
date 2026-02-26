<p align="center">
  <img src="icons/icon128.png" width="80" />
</p>

<h1 align="center">Sidebar Tab Manager</h1>

<p align="center">
  <strong>一个优雅的 Chrome 侧边栏标签页管理器</strong><br>
  告别杂乱的标签栏，用侧边栏高效管理你的所有标签页
</p>

<p align="center">
  <a href="./README_EN.md">English</a> · 中文
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-114%2B-brightgreen?logo=googlechrome&logoColor=white" />
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" />
</p>

---

## ✨ 功能亮点

- **侧边栏标签管理** — 在侧边栏中纵向排列所有标签页，一目了然
- **完整的分组支持** — 与 Chrome 原生标签页分组无缝同步，支持折叠/展开、颜色、重命名
- **右键菜单** — 刷新、复制链接、固定、创建分组、添加到分组、关闭等常用操作
- **分组右键菜单** — 重命名、更改颜色、折叠/展开、取消分组、关闭分组内所有标签页
- **拖拽排序** — 拖动标签页改变顺序、拖入/拖出分组、拖动分组改变分组顺序
- **多选操作** — `⌘+Click` 逐个选择，`Shift+Click` 范围选择，批量刷新/分组/关闭
- **搜索过滤** — 按标题或 URL 实时搜索标签页
- **关闭不跳动** — 关闭标签页时，其上方的标签页位置保持不变
- **深色主题** — 精心设计的暗色 UI，与 Chrome 深色模式完美融合
- **快捷键支持** — `⌘+Shift+S` 打开侧边栏，`Ctrl+Tab` 切换到上一个标签页，`⌘+Shift+G` 展开/折叠所有分组

## 📸 预览

```
┌──────────────────────────────────────────────────┬────────────────────────┐
│                                                  │  🟦 标签管理器         │
│                                                  │  118 个标签页          │
│                                                  │  🔍 搜索标签页...      │
│                                                  │ ┌──────────────────┐  │
│                                                  │ │ 🔵 工作    (5) ▼ │  │
│               网页内容区域                        │ │  GitHub          │  │
│                                                  │ │  Notion          │  │
│                                                  │ │  Figma           │  │
│                                                  │ │  Linear          │  │
│                                                  │ │  Vercel          │  │
│                                                  │ ├──────────────────┤  │
│                                                  │ │ 🟡 学习    (3) ▼ │  │
│                                                  │ │  MDN Docs        │  │
│                                                  │ │  Stack Overflow  │  │
│                                                  │ │  ChatGPT         │  │
│                                                  │ ├──────────────────┤  │
│                                                  │ │ 未分组           │  │
│                                                  │ │  Google          │  │
│                                                  │ │  YouTube         │  │
│                                                  │ └──────────────────┘  │
└──────────────────────────────────────────────────┴────────────────────────┘
```

## 🚀 安装

### 从源码安装（开发者模式）

1. **下载代码**

```bash
git clone https://github.com/user/sidebar-tab-manager.git
```

2. **加载扩展**
   - 打开 Chrome，访问 `chrome://extensions/`
   - 右上角开启 **开发者模式**
   - 点击 **「加载已解压的扩展程序」**
   - 选择项目文件夹

3. **将侧边栏移到左侧**（可选）
   - 打开 `chrome://settings/appearance`
   - 找到「侧边栏位置」→ 选择「左侧」

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `⌘+Shift+S` | 打开侧边栏 |
| `Ctrl+Tab` | 切换到上一次访问的标签页 |
| `⌘+Shift+G` | 展开/折叠所有分组 |
| `⌘+Click` | 多选标签页 |
| `Shift+Click` | 范围选择标签页 |

> 快捷键可在 `chrome://extensions/shortcuts` 自定义

## 🖱️ 操作指南

### 标签页操作
| 操作 | 方式 |
|------|------|
| 切换标签页 | 左键点击 |
| 关闭标签页 | 悬停后点击 ✕，或右键 → 关闭 |
| 右键菜单 | 右键点击标签页 |
| 拖拽排序 | 按住拖动标签页 |
| 拖入分组 | 拖动标签页到分组标题上 |

### 分组操作
| 操作 | 方式 |
|------|------|
| 折叠/展开 | 左键点击分组标题 |
| 分组菜单 | 右键点击分组标题 |
| 重命名 | 右键 → 重命名分组 |
| 改颜色 | 右键 → 更改颜色 |
| 拖拽分组 | 按住分组标题拖动 |

### 多选操作
| 操作 | 方式 |
|------|------|
| 逐个选择 | `⌘+Click` |
| 范围选择 | `Shift+Click` |
| 批量操作 | 选中后右键 → 刷新/创建分组/添加到分组/关闭 |

## 🏗️ 技术栈

- **Chrome Extension Manifest V3**
- **Chrome Side Panel API** (Chrome 114+)
- **Chrome Tabs & TabGroups API**
- **原生 JavaScript** — 零依赖，轻量快速

## 📁 项目结构

```
sidebar-tab-manager/
├── manifest.json       # 扩展配置文件
├── background.js       # Service Worker
├── sidebar.html        # 侧边栏页面
├── sidebar.js          # 交互逻辑
├── sidebar.css         # 样式（深色主题）
└── icons/              # 扩展图标
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 📄 License

[MIT](LICENSE)

---

<p align="center">
  如果觉得有用，欢迎 ⭐ Star 支持一下！
</p>
