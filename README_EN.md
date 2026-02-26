<p align="center">
  <img src="icons/icon128.png" width="80" />
</p>

<h1 align="center">Sidebar Tab Manager</h1>

<p align="center">
  <strong>An elegant Chrome sidebar extension for managing tabs</strong><br>
  Say goodbye to cluttered tab bars — manage all your tabs efficiently from the sidebar
</p>

<p align="center">
  English · <a href="./README.md">中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-114%2B-brightgreen?logo=googlechrome&logoColor=white" />
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" />
</p>

---

## ✨ Features

- **Sidebar Tab View** — All tabs displayed vertically in the sidebar for easy scanning
- **Full Tab Group Support** — Seamlessly syncs with Chrome's native tab groups: collapse/expand, colors, rename
- **Tab Context Menu** — Reload, copy link, pin, create group, add to group, close
- **Group Context Menu** — Rename, change color, collapse/expand, ungroup, close all tabs in group
- **Drag & Drop** — Reorder tabs, drag tabs into/out of groups, reorder groups
- **Multi-Select** — `⌘+Click` to toggle, `Shift+Click` for range select, batch refresh/group/close
- **Search & Filter** — Real-time search by title or URL
- **Stable Close** — When closing a tab, tabs above it stay in place (no scroll jump)
- **Dark Theme** — Carefully crafted dark UI that blends perfectly with Chrome's dark mode
- **Keyboard Shortcuts** — `⌘+Shift+S` to open sidebar, `Ctrl+Tab` to switch to last tab, `⌘+Shift+G` to toggle all groups

## 📸 Preview

```
┌──────────────────────────────────────────────────┬────────────────────────┐
│                                                  │  🟦 Tab Manager        │
│                                                  │  118 tabs              │
│                                                  │  🔍 Search tabs...     │
│                                                  │ ┌──────────────────┐  │
│                                                  │ │ 🔵 Work    (5) ▼ │  │
│                Web Page Content                  │ │  GitHub          │  │
│                                                  │ │  Notion          │  │
│                                                  │ │  Figma           │  │
│                                                  │ │  Linear          │  │
│                                                  │ │  Vercel          │  │
│                                                  │ ├──────────────────┤  │
│                                                  │ │ 🟡 Study   (3) ▼ │  │
│                                                  │ │  MDN Docs        │  │
│                                                  │ │  Stack Overflow  │  │
│                                                  │ │  ChatGPT         │  │
│                                                  │ ├──────────────────┤  │
│                                                  │ │ Ungrouped        │  │
│                                                  │ │  Google          │  │
│                                                  │ │  YouTube         │  │
│                                                  │ └──────────────────┘  │
└──────────────────────────────────────────────────┴────────────────────────┘
```

## 🚀 Installation

### Install from Source (Developer Mode)

1. **Clone the repository**

```bash
git clone https://github.com/user/sidebar-tab-manager.git
```

2. **Load the extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** in the top-right corner
   - Click **"Load unpacked"**
   - Select the project folder

3. **Move sidebar to the left** (optional)
   - Go to `chrome://settings/appearance`
   - Find "Side panel position" → Select "Left"

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘+Shift+S` | Open sidebar |
| `Ctrl+Tab` | Switch to previously visited tab |
| `⌘+Shift+G` | Toggle all groups collapse/expand |
| `⌘+Click` | Multi-select tabs |
| `Shift+Click` | Range-select tabs |

> Shortcuts can be customized at `chrome://extensions/shortcuts`

## 🖱️ Usage Guide

### Tab Actions
| Action | How |
|--------|-----|
| Switch tab | Left-click |
| Close tab | Hover and click ✕, or Right-click → Close |
| Context menu | Right-click on a tab |
| Drag to reorder | Hold and drag a tab |
| Drag into group | Drag a tab onto a group header |

### Group Actions
| Action | How |
|--------|-----|
| Collapse/Expand | Left-click group header |
| Group menu | Right-click group header |
| Rename | Right-click → Rename group |
| Change color | Right-click → Change color |
| Reorder groups | Hold and drag group header |

### Multi-Select
| Action | How |
|--------|-----|
| Toggle select | `⌘+Click` |
| Range select | `Shift+Click` |
| Batch actions | After selecting, right-click → Reload / Create group / Add to group / Close |

## 🏗️ Tech Stack

- **Chrome Extension Manifest V3**
- **Chrome Side Panel API** (Chrome 114+)
- **Chrome Tabs & TabGroups API**
- **Vanilla JavaScript** — Zero dependencies, lightweight and fast

## 📁 Project Structure

```
sidebar-tab-manager/
├── manifest.json       # Extension configuration
├── background.js       # Service Worker
├── sidebar.html        # Sidebar page
├── sidebar.js          # UI logic
├── sidebar.css         # Styles (dark theme)
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 📄 License

[MIT](LICENSE)

---

<p align="center">
  If you find this useful, please consider giving it a ⭐ Star!
</p>
