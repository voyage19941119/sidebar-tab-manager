// 全局状态
let currentWindowId = null;
let contextMenuTabId = null;
let contextMenuTabPinned = false;
let contextMenuTabGroupId = null;
let tabData = { groups: [], ungroupedTabs: [] };
let draggedTabId = null;
let draggedTabGroupId = null;
let draggedGroupId = null; // 正在拖动的分组 ID
let selectedTabIds = new Set(); // 多选的标签页 ID
let lastClickedTabId = null; // 上次点击的标签页（用于 Shift 范围选择）

// 分组右键菜单状态
let contextMenuGroupId = null;
let contextMenuGroupCollapsed = false;

// DOM 元素
const tabList = document.getElementById('tabList');
const tabCount = document.getElementById('tabCount');
const searchInput = document.getElementById('searchInput');
const contextMenu = document.getElementById('contextMenu');
const pinText = document.getElementById('pinText');
const groupSubmenu = document.getElementById('groupSubmenu');
const removeFromGroupItem = document.getElementById('removeFromGroupItem');
const addToGroupItem = document.getElementById('addToGroupItem');

// 分组菜单元素
const groupContextMenu = document.getElementById('groupContextMenu');
const colorSubmenu = document.getElementById('colorSubmenu');
const collapseText = document.getElementById('collapseText');
const renameDialog = document.getElementById('renameDialog');
const renameInput = document.getElementById('renameInput');
const renameCancel = document.getElementById('renameCancel');
const renameConfirm = document.getElementById('renameConfirm');

// 初始化
async function init() {
  // 获取当前窗口 ID
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentWindowId = currentTab.windowId;
  
  // 加载标签页
  await loadTabs();
  
  // 设置事件监听
  setupEventListeners();
  
  // 监听标签页变化
  setupTabListeners();
}

// 加载标签页
async function loadTabs() {
  const response = await chrome.runtime.sendMessage({
    type: 'GET_TABS',
    windowId: currentWindowId
  });
  
  if (response.success) {
    tabData = response;
    renderTabs();
    updateTabCount(response.totalCount);
  }
}

// 更新标签页计数
function updateTabCount(count) {
  tabCount.textContent = `${count} 个标签页`;
}

// 渲染标签页列表
function renderTabs() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  let html = '';
  
  // 渲染分组
  tabData.groups.forEach(group => {
    const filteredTabs = filterTabs(group.tabs, searchTerm);
    if (searchTerm && filteredTabs.length === 0) return;
    
    const isCollapsed = group.collapsed && !searchTerm;
    
    html += `
      <div class="tab-group ${searchTerm && filteredTabs.length === 0 ? 'hidden' : ''}" data-group-id="${group.id}" data-color="${group.color}" data-first-index="${group.firstTabIndex}">
        <div class="group-header ${isCollapsed ? 'collapsed' : ''}" data-group-id="${group.id}" draggable="true">
          <div class="group-indicator ${group.color}"></div>
          <span class="group-title">${escapeHtml(group.title)}</span>
          <span class="group-count">${group.tabs.length}</span>
          <svg class="group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="group-tabs ${isCollapsed ? 'collapsed' : ''}" style="max-height: ${isCollapsed ? 0 : filteredTabs.length * 60}px">
          ${renderTabItems(searchTerm ? filteredTabs : group.tabs, searchTerm)}
        </div>
      </div>
    `;
  });
  
  // 渲染未分组标签页
  const filteredUngrouped = filterTabs(tabData.ungroupedTabs, searchTerm);
  if (filteredUngrouped.length > 0 || (!searchTerm && tabData.ungroupedTabs.length > 0)) {
    const tabs = searchTerm ? filteredUngrouped : tabData.ungroupedTabs;
    if (tabs.length > 0) {
      html += `
        <div class="ungrouped-section">
          ${tabData.groups.length > 0 ? '<div class="ungrouped-header">未分组</div>' : ''}
          ${renderTabItems(tabs, searchTerm)}
        </div>
      `;
    }
  }
  
  // 空状态
  if (!html) {
    html = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
        </svg>
        <p>没有找到匹配的标签页</p>
      </div>
    `;
  }
  
  tabList.innerHTML = html;
  
  // 重新应用选中状态
  if (selectedTabIds.size > 0) {
    updateSelectionUI();
  }
}

// 过滤标签页
function filterTabs(tabs, searchTerm) {
  if (!searchTerm) return tabs;
  return tabs.filter(tab => 
    tab.title.toLowerCase().includes(searchTerm) ||
    tab.url.toLowerCase().includes(searchTerm)
  );
}

// 渲染标签页项目
function renderTabItems(tabs, searchTerm) {
  return tabs.map(tab => {
    const title = searchTerm ? highlightText(tab.title, searchTerm) : escapeHtml(tab.title);
    const domain = getDomain(tab.url);
    const groupId = tab.groupId !== undefined && tab.groupId !== -1 ? tab.groupId : -1;
    
    return `
      <div class="tab-item ${tab.active ? 'active' : ''} ${tab.pinned ? 'pinned' : ''}" 
           data-tab-id="${tab.id}"
           data-pinned="${tab.pinned}"
           data-group-id="${groupId}"
           data-index="${tab.index}"
           draggable="${!tab.pinned}">
        <div class="tab-favicon">
          ${tab.favIconUrl 
            ? `<img src="${escapeHtml(tab.favIconUrl)}" data-favicon="true" />`
            : getFaviconPlaceholder()
          }
        </div>
        <div class="tab-info">
          <div class="tab-title">${title}</div>
          <div class="tab-url">${escapeHtml(domain)}</div>
        </div>
        <div class="tab-close" data-tab-id="${tab.id}" title="关闭标签页">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>
    `;
  }).join('');
}

// 获取默认 favicon 占位符
function getFaviconPlaceholder() {
  return `<div class="tab-favicon-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg></div>`;
}

// 高亮搜索文本
function highlightText(text, searchTerm) {
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  return escaped.replace(regex, '<span class="highlight">$1</span>');
}

// 获取域名
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname || url;
  } catch {
    return url;
  }
}

// 转义 HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 转义正则表达式特殊字符
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 设置事件监听
function setupEventListeners() {
  // 点击标签页
  tabList.addEventListener('click', handleTabClick);
  
  // 右键菜单
  tabList.addEventListener('contextmenu', handleContextMenu);
  
  // 关闭按钮
  tabList.addEventListener('click', handleCloseClick);
  
  // 分组折叠
  tabList.addEventListener('click', handleGroupToggle);
  
  // 搜索
  searchInput.addEventListener('input', debounce(renderTabs, 150));
  
  // 右键菜单操作
  contextMenu.addEventListener('click', handleContextMenuAction);
  
  // 点击其他地方关闭右键菜单
  document.addEventListener('click', hideAllMenus);
  
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    // Escape 关闭右键菜单和对话框
    if (e.key === 'Escape') {
      hideAllMenus();
      hideRenameDialog();
    }
    
    // Ctrl+Tab 切换到上一次访问的标签页
    if (e.key === 'Tab' && e.ctrlKey) {
      e.preventDefault();
      switchToPreviousTab();
    }
    
    // Cmd+Shift+G 展开/关闭所有分组
    if (e.key === 'G' && e.metaKey && e.shiftKey) {
      e.preventDefault();
      toggleAllGroups();
    }
  });
  
  // 侧边栏失去焦点时关闭菜单（用户点击了浏览器其他区域）
  window.addEventListener('blur', () => {
    hideAllMenus();
    hideRenameDialog();
  });
  
  // 使用事件委托处理 favicon 加载错误（使用捕获阶段）
  tabList.addEventListener('error', handleFaviconError, true);
  
  // 拖拽事件
  tabList.addEventListener('dragstart', handleDragStart);
  tabList.addEventListener('dragend', handleDragEnd);
  tabList.addEventListener('dragover', handleDragOver);
  tabList.addEventListener('dragleave', handleDragLeave);
  tabList.addEventListener('drop', handleDrop);
  
  // 分组右键菜单
  groupContextMenu.addEventListener('click', handleGroupContextMenuAction);
  
  // 颜色选择
  colorSubmenu.addEventListener('click', handleColorSelect);
  
  // 重命名对话框（阻止冒泡，避免触发 document 的 hideAllMenus）
  renameDialog.addEventListener('click', (e) => e.stopPropagation());
  renameCancel.addEventListener('click', hideRenameDialog);
  renameConfirm.addEventListener('click', confirmRename);
  renameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmRename();
  });
}

// 处理 favicon 加载错误
function handleFaviconError(e) {
  if (e.target.tagName === 'IMG' && e.target.dataset.favicon) {
    e.target.parentElement.innerHTML = getFaviconPlaceholder();
  }
}

// 切换到上一次访问的标签页
async function switchToPreviousTab() {
  const response = await chrome.runtime.sendMessage({
    type: 'SWITCH_TO_PREVIOUS_TAB',
    windowId: currentWindowId
  });
  
  if (!response.success) {
    console.log('No previous tab to switch to');
  }
}

// 展开/关闭所有分组
async function toggleAllGroups() {
  if (tabData.groups.length === 0) return;
  
  // 检查是否有任何分组是展开的
  const hasExpandedGroup = tabData.groups.some(group => !group.collapsed);
  
  // 如果有展开的分组，则全部折叠；否则全部展开
  const shouldCollapse = hasExpandedGroup;
  
  // 更新所有分组
  for (const group of tabData.groups) {
    await chrome.runtime.sendMessage({
      type: 'TOGGLE_GROUP_COLLAPSED',
      groupId: group.id,
      collapsed: shouldCollapse
    });
  }
}

// 处理标签页点击
function handleTabClick(e) {
  const tabItem = e.target.closest('.tab-item');
  if (!tabItem || e.target.closest('.tab-close')) return;
  
  const tabId = parseInt(tabItem.dataset.tabId);
  
  // Shift+Click 范围选择
  if (e.shiftKey && lastClickedTabId !== null) {
    e.preventDefault();
    rangeSelectTabs(lastClickedTabId, tabId);
    return;
  }
  
  // Cmd+Click 多选
  if (e.metaKey) {
    e.preventDefault();
    toggleTabSelection(tabId);
    lastClickedTabId = tabId;
    return;
  }
  
  // 普通点击：清除多选，切换标签页
  clearSelection();
  lastClickedTabId = tabId;
  chrome.runtime.sendMessage({ type: 'SWITCH_TAB', tabId });
}

// 切换标签页的选中状态
function toggleTabSelection(tabId) {
  if (selectedTabIds.has(tabId)) {
    selectedTabIds.delete(tabId);
  } else {
    selectedTabIds.add(tabId);
  }
  updateSelectionUI();
}

// Shift+Click 范围选择
function rangeSelectTabs(fromTabId, toTabId) {
  // 获取页面上所有标签页元素的顺序
  const allTabItems = [...document.querySelectorAll('.tab-item')];
  const allTabIds = allTabItems.map(el => parseInt(el.dataset.tabId));
  
  const fromIndex = allTabIds.indexOf(fromTabId);
  const toIndex = allTabIds.indexOf(toTabId);
  
  if (fromIndex === -1 || toIndex === -1) return;
  
  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  
  // 选中范围内的所有标签页
  for (let i = start; i <= end; i++) {
    selectedTabIds.add(allTabIds[i]);
  }
  
  updateSelectionUI();
}

// 清除所有选中
function clearSelection() {
  selectedTabIds.clear();
  updateSelectionUI();
}

// 更新选中状态的 UI
function updateSelectionUI() {
  document.querySelectorAll('.tab-item').forEach(item => {
    const tabId = parseInt(item.dataset.tabId);
    item.classList.toggle('selected', selectedTabIds.has(tabId));
  });
  
  // 更新选中计数
  const countEl = document.getElementById('selectionCount');
  if (selectedTabIds.size > 0) {
    countEl.textContent = `已选中 ${selectedTabIds.size} 个标签页`;
    countEl.classList.add('visible');
  } else {
    countEl.classList.remove('visible');
  }
}

// 获取当前操作的标签页 ID 列表（多选时返回所有选中的，否则返回右键点击的）
function getTargetTabIds() {
  if (selectedTabIds.size > 0) {
    // 如果右键的标签页在选中集合中，操作所有选中的
    if (selectedTabIds.has(contextMenuTabId)) {
      return [...selectedTabIds];
    }
  }
  // 否则只操作右键点击的那个
  return [contextMenuTabId];
}

// 处理关闭按钮点击
function handleCloseClick(e) {
  const closeBtn = e.target.closest('.tab-close');
  if (!closeBtn) return;
  
  e.stopPropagation();
  const tabId = parseInt(closeBtn.dataset.tabId);
  closeTab(tabId);
}

// 关闭标签页（保持位置不变）
async function closeTab(tabId) {
  const tabItem = document.querySelector(`.tab-item[data-tab-id="${tabId}"]`);
  if (!tabItem) return;
  
  // 获取被删除元素在其之前的元素的总高度信息
  const scrollTop = tabList.scrollTop;
  const itemTop = tabItem.offsetTop;
  const itemHeight = tabItem.offsetHeight;
  
  // 判断被删除的元素是否在可视区域上方
  const isAboveViewport = itemTop < scrollTop;
  
  // 发送关闭请求
  await chrome.runtime.sendMessage({ type: 'CLOSE_TAB', tabId });
  
  // 如果被删除的标签页在滚动位置上方，需要调整滚动位置
  // 这样下方的标签页位置就不会变化
  if (isAboveViewport) {
    // 使用 requestAnimationFrame 确保在 DOM 更新后调整
    requestAnimationFrame(() => {
      tabList.scrollTop = scrollTop - itemHeight;
    });
  }
}

// 处理分组折叠
function handleGroupToggle(e) {
  const groupHeader = e.target.closest('.group-header');
  if (!groupHeader) return;
  
  const groupId = parseInt(groupHeader.dataset.groupId);
  const isCollapsed = groupHeader.classList.contains('collapsed');
  
  // 切换折叠状态
  groupHeader.classList.toggle('collapsed');
  const groupTabs = groupHeader.nextElementSibling;
  
  if (isCollapsed) {
    // 展开
    groupTabs.classList.remove('collapsed');
    const tabCount = groupTabs.querySelectorAll('.tab-item').length;
    groupTabs.style.maxHeight = `${tabCount * 60}px`;
  } else {
    // 折叠
    groupTabs.classList.add('collapsed');
    groupTabs.style.maxHeight = '0px';
  }
  
  // 同步到 Chrome
  chrome.runtime.sendMessage({
    type: 'TOGGLE_GROUP_COLLAPSED',
    groupId,
    collapsed: !isCollapsed
  });
}

// 处理右键菜单
function handleContextMenu(e) {
  // 检查菜单是否已经打开
  const menuVisible = contextMenu.classList.contains('visible') || 
                      groupContextMenu.classList.contains('visible');
  
  // 如果菜单已打开，再次右键则关闭
  if (menuVisible) {
    e.preventDefault();
    hideAllMenus();
    return;
  }
  
  // 检查是否点击了分组头部
  const groupHeader = e.target.closest('.group-header');
  if (groupHeader) {
    e.preventDefault();
    e.stopPropagation();
    showGroupContextMenu(e, groupHeader);
    return;
  }
  
  // 检查是否点击了标签页
  const tabItem = e.target.closest('.tab-item');
  if (!tabItem) return;
  
  e.preventDefault();
  
  contextMenuTabId = parseInt(tabItem.dataset.tabId);
  contextMenuTabPinned = tabItem.dataset.pinned === 'true';
  contextMenuTabGroupId = parseInt(tabItem.dataset.groupId) || -1;
  
  // 如果右键的标签页不在已选集合中，且有选中的标签页，清除选中
  const isMulti = selectedTabIds.size > 0 && selectedTabIds.has(contextMenuTabId);
  const targetIds = isMulti ? [...selectedTabIds] : [contextMenuTabId];
  const targetCount = targetIds.length;
  
  // 更新菜单项文本
  const contextMenuLabel = document.getElementById('contextMenuLabel');
  if (targetCount > 1) {
    contextMenuLabel.textContent = `${targetCount} 个标签页`;
    contextMenuLabel.style.display = 'block';
  } else {
    contextMenuLabel.style.display = 'none';
  }
  
  // 更新固定/取消固定文本
  document.getElementById('pinItem').style.display = targetCount > 1 ? 'none' : 'flex';
  pinText.textContent = contextMenuTabPinned ? '取消固定' : '固定标签页';
  
  // 显示/隐藏"从分组移除"选项
  if (contextMenuTabGroupId !== -1) {
    removeFromGroupItem.style.display = 'flex';
  } else {
    removeFromGroupItem.style.display = 'none';
  }
  
  // 显示/隐藏"添加到已有分组"选项
  const otherGroups = tabData.groups.filter(g => g.id !== contextMenuTabGroupId);
  if (otherGroups.length > 0) {
    addToGroupItem.style.display = 'flex';
    populateGroupSubmenu();
  } else {
    addToGroupItem.style.display = 'none';
  }
  
  // 先显示菜单以获取尺寸
  contextMenu.style.visibility = 'hidden';
  contextMenu.classList.add('visible');
  
  // 自适应定位菜单
  positionContextMenu(contextMenu, e.clientX, e.clientY);
  contextMenu.style.visibility = 'visible';
}

// 显示分组右键菜单
function showGroupContextMenu(e, groupHeader) {
  contextMenuGroupId = parseInt(groupHeader.dataset.groupId);
  contextMenuGroupCollapsed = groupHeader.classList.contains('collapsed');
  
  // 更新折叠/展开文本
  collapseText.textContent = contextMenuGroupCollapsed ? '展开分组' : '折叠分组';
  
  // 先显示菜单以获取尺寸
  groupContextMenu.style.visibility = 'hidden';
  groupContextMenu.classList.add('visible');
  
  // 自适应定位菜单
  positionContextMenu(groupContextMenu, e.clientX, e.clientY);
  groupContextMenu.style.visibility = 'visible';
}

// 自适应定位右键菜单
function positionContextMenu(menu, x, y) {
  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // 计算最终位置
  let finalX = x;
  let finalY = y;
  
  // 如果菜单超出右边界，向左显示
  if (x + menuRect.width > viewportWidth) {
    finalX = Math.max(0, viewportWidth - menuRect.width - 10);
  }
  
  // 如果菜单超出下边界，向上显示
  if (y + menuRect.height > viewportHeight) {
    finalY = Math.max(0, viewportHeight - menuRect.height - 10);
  }
  
  menu.style.left = `${finalX}px`;
  menu.style.top = `${finalY}px`;
}

// 填充分组子菜单（只显示已有分组）
function populateGroupSubmenu() {
  let html = '';
  
  // 已有分组（排除当前标签页所在的分组）
  tabData.groups.forEach(group => {
    if (group.id === contextMenuTabGroupId) return;
    
    html += `
      <div class="submenu-item" data-group-id="${group.id}">
        <div class="group-color ${group.color}"></div>
        <span>${escapeHtml(group.title)}</span>
      </div>
    `;
  });
  
  groupSubmenu.innerHTML = html;
  
  // 绑定子菜单点击事件
  groupSubmenu.querySelectorAll('.submenu-item').forEach(item => {
    item.addEventListener('click', handleGroupSubmenuClick);
  });
}

// 处理分组子菜单点击（添加到已有分组）
async function handleGroupSubmenuClick(e) {
  e.stopPropagation();
  const item = e.currentTarget;
  
  const groupId = parseInt(item.dataset.groupId);
  const tabIds = getTargetTabIds();
  await chrome.runtime.sendMessage({
    type: 'ADD_TABS_TO_GROUP',
    tabIds,
    groupId
  });
  
  clearSelection();
  hideContextMenu();
}

// 创建新分组
async function createNewGroup() {
  const colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  const tabIds = getTargetTabIds();
  await chrome.runtime.sendMessage({
    type: 'CREATE_GROUP_WITH_TABS',
    tabIds,
    title: '新分组',
    color: randomColor
  });
  
  clearSelection();
}

// 隐藏所有菜单
function hideAllMenus() {
  contextMenu.classList.remove('visible');
  groupContextMenu.classList.remove('visible');
}

// 隐藏右键菜单（兼容旧调用）
function hideContextMenu() {
  hideAllMenus();
}

// 处理右键菜单操作
async function handleContextMenuAction(e) {
  const item = e.target.closest('.context-menu-item');
  if (!item || item.classList.contains('has-submenu')) return;
  
  const action = item.dataset.action;
  const tabIds = getTargetTabIds();
  
  switch (action) {
    case 'reload':
      for (const id of tabIds) {
        chrome.runtime.sendMessage({ type: 'RELOAD_TAB', tabId: id });
      }
      break;
    case 'copyLink':
      copyTabLinks(tabIds);
      break;
    case 'pin':
      chrome.runtime.sendMessage({ type: 'TOGGLE_PIN', tabId: contextMenuTabId });
      break;
    case 'close':
      for (const id of tabIds) {
        closeTab(id);
      }
      break;
    case 'removeFromGroup':
      for (const id of tabIds) {
        chrome.runtime.sendMessage({ type: 'REMOVE_TAB_FROM_GROUP', tabId: id });
      }
      break;
    case 'createNewGroup':
      createNewGroup();
      break;
  }
  
  clearSelection();
  hideAllMenus();
}

// 从 tabData 中查找标签页
function findTabById(tabId) {
  for (const group of tabData.groups) {
    const tab = group.tabs.find(t => t.id === tabId);
    if (tab) return tab;
  }
  return tabData.ungroupedTabs.find(t => t.id === tabId) || null;
}

// 复制标签页链接（支持多选）
async function copyTabLinks(tabIds) {
  const urls = tabIds
    .map(id => findTabById(id))
    .filter(tab => tab && tab.url)
    .map(tab => tab.url);
  
  if (urls.length > 0) {
    try {
      await navigator.clipboard.writeText(urls.join('\n'));
    } catch (err) {
      console.error('Failed to copy links:', err);
    }
  }
}

// 处理分组右键菜单操作
async function handleGroupContextMenuAction(e) {
  const item = e.target.closest('.context-menu-item');
  if (!item || item.classList.contains('has-submenu')) return;
  
  const action = item.dataset.action;
  
  switch (action) {
    case 'renameGroup':
      showRenameDialog();
      break;
    case 'collapseGroup':
      chrome.runtime.sendMessage({
        type: 'TOGGLE_GROUP_COLLAPSED',
        groupId: contextMenuGroupId,
        collapsed: !contextMenuGroupCollapsed
      });
      break;
    case 'ungroupTabs':
      chrome.runtime.sendMessage({
        type: 'UNGROUP',
        groupId: contextMenuGroupId
      });
      break;
    case 'closeGroupTabs':
      chrome.runtime.sendMessage({
        type: 'CLOSE_GROUP_TABS',
        groupId: contextMenuGroupId
      });
      break;
  }
  
  hideAllMenus();
}

// 处理颜色选择
function handleColorSelect(e) {
  const colorItem = e.target.closest('.color-item');
  if (!colorItem) return;
  
  e.stopPropagation();
  
  const color = colorItem.dataset.color;
  chrome.runtime.sendMessage({
    type: 'CHANGE_GROUP_COLOR',
    groupId: contextMenuGroupId,
    color
  });
  
  hideAllMenus();
}

// 显示重命名对话框
function showRenameDialog() {
  const renameGroupId = contextMenuGroupId;
  const group = tabData.groups.find(g => g.id === renameGroupId);
  renameInput.value = group ? group.title : '';
  
  // 存储待重命名的分组 ID
  renameDialog.dataset.groupId = renameGroupId;
  renameDialog.classList.add('visible');
  
  // 延迟 focus 避免被其他事件干扰
  setTimeout(() => {
    renameInput.focus();
    renameInput.select();
  }, 50);
}

// 隐藏重命名对话框
function hideRenameDialog() {
  renameDialog.classList.remove('visible');
}

// 确认重命名
async function confirmRename() {
  const newTitle = renameInput.value.trim();
  const groupId = parseInt(renameDialog.dataset.groupId);
  
  if (newTitle && groupId) {
    await chrome.runtime.sendMessage({
      type: 'RENAME_GROUP',
      groupId,
      title: newTitle
    });
    await loadTabs();
  }
  hideRenameDialog();
}

// 设置标签页监听器
function setupTabListeners() {
  // 标签页创建
  chrome.tabs.onCreated.addListener(() => loadTabs());
  
  // 标签页移除
  chrome.tabs.onRemoved.addListener(() => loadTabs());
  
  // 标签页更新
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.title || changeInfo.favIconUrl || changeInfo.url || changeInfo.pinned !== undefined) {
      loadTabs();
    }
  });
  
  // 标签页激活
  chrome.tabs.onActivated.addListener(() => loadTabs());
  
  // 标签页移动
  chrome.tabs.onMoved.addListener(() => loadTabs());
  
  // 标签页附加到窗口
  chrome.tabs.onAttached.addListener(() => loadTabs());
  
  // 标签页分离
  chrome.tabs.onDetached.addListener(() => loadTabs());
  
  // 分组更新
  chrome.tabGroups.onCreated.addListener(() => loadTabs());
  chrome.tabGroups.onRemoved.addListener(() => loadTabs());
  chrome.tabGroups.onUpdated.addListener(() => loadTabs());
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ========== 拖拽功能 ==========

// 开始拖拽
function handleDragStart(e) {
  // 检查是否拖动分组头部
  const groupHeader = e.target.closest('.group-header');
  if (groupHeader) {
    draggedGroupId = parseInt(groupHeader.dataset.groupId);
    draggedTabId = null;
    draggedTabGroupId = null;
    
    const tabGroup = groupHeader.closest('.tab-group');
    if (tabGroup) tabGroup.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `group:${draggedGroupId}`);
    return;
  }
  
  // 拖动标签页
  const tabItem = e.target.closest('.tab-item');
  if (!tabItem || tabItem.dataset.pinned === 'true') {
    e.preventDefault();
    return;
  }
  
  draggedTabId = parseInt(tabItem.dataset.tabId);
  draggedTabGroupId = parseInt(tabItem.dataset.groupId) || -1;
  draggedGroupId = null;
  
  tabItem.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', `tab:${draggedTabId}`);
}

// 结束拖拽
function handleDragEnd(e) {
  const tabItem = e.target.closest('.tab-item');
  if (tabItem) {
    tabItem.classList.remove('dragging');
  }
  
  const tabGroup = e.target.closest('.tab-group');
  if (tabGroup) {
    tabGroup.classList.remove('dragging');
  }
  
  // 清除所有拖拽状态
  clearDragStyles();
  draggedTabId = null;
  draggedTabGroupId = null;
  draggedGroupId = null;
}

// 清除拖拽样式
function clearDragStyles() {
  document.querySelectorAll('.drag-over, .drag-over-bottom').forEach(el => {
    el.classList.remove('drag-over', 'drag-over-bottom');
  });
  document.querySelectorAll('.group-header.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
  document.querySelectorAll('.tab-group.drag-over-above, .tab-group.drag-over-below').forEach(el => {
    el.classList.remove('drag-over-above', 'drag-over-below');
  });
}

// 拖拽经过
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  clearDragStyles();
  
  // 如果正在拖动分组
  if (draggedGroupId !== null) {
    const tabGroup = e.target.closest('.tab-group');
    if (tabGroup) {
      const groupId = parseInt(tabGroup.dataset.groupId);
      if (groupId !== draggedGroupId) {
        const rect = tabGroup.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        
        if (e.clientY < midY) {
          tabGroup.classList.add('drag-over-above');
        } else {
          tabGroup.classList.add('drag-over-below');
        }
      }
    }
    return;
  }
  
  // 检查是否在分组标题上（拖动标签页到分组）
  const groupHeader = e.target.closest('.group-header');
  if (groupHeader) {
    const groupId = parseInt(groupHeader.dataset.groupId);
    if (groupId !== draggedTabGroupId) {
      groupHeader.classList.add('drag-over');
    }
    return;
  }
  
  // 检查是否在标签页上
  const tabItem = e.target.closest('.tab-item');
  if (tabItem && parseInt(tabItem.dataset.tabId) !== draggedTabId) {
    const rect = tabItem.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    
    if (e.clientY < midY) {
      tabItem.classList.add('drag-over');
    } else {
      tabItem.classList.add('drag-over-bottom');
    }
  }
}

// 拖拽离开
function handleDragLeave(e) {
  const tabItem = e.target.closest('.tab-item');
  const groupHeader = e.target.closest('.group-header');
  const tabGroup = e.target.closest('.tab-group');
  
  if (tabItem) {
    tabItem.classList.remove('drag-over', 'drag-over-bottom');
  }
  if (groupHeader) {
    groupHeader.classList.remove('drag-over');
  }
  if (tabGroup) {
    tabGroup.classList.remove('drag-over-above', 'drag-over-below');
  }
}

// 放置
async function handleDrop(e) {
  e.preventDefault();
  clearDragStyles();
  
  // 如果正在拖动分组
  if (draggedGroupId !== null) {
    const tabGroup = e.target.closest('.tab-group');
    if (tabGroup) {
      const targetGroupId = parseInt(tabGroup.dataset.groupId);
      if (targetGroupId !== draggedGroupId) {
        const rect = tabGroup.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const targetIndex = parseInt(tabGroup.dataset.firstIndex);
        
        // 计算目标位置
        let newIndex = e.clientY < midY ? targetIndex : targetIndex + 1;
        
        await chrome.runtime.sendMessage({
          type: 'MOVE_GROUP',
          groupId: draggedGroupId,
          targetIndex: newIndex
        });
      }
    }
    return;
  }
  
  if (!draggedTabId) return;
  
  // 检查是否放在分组标题上
  const groupHeader = e.target.closest('.group-header');
  if (groupHeader) {
    const targetGroupId = parseInt(groupHeader.dataset.groupId);
    if (targetGroupId !== draggedTabGroupId) {
      await chrome.runtime.sendMessage({
        type: 'MOVE_TAB',
        tabId: draggedTabId,
        targetGroupId
      });
    }
    return;
  }
  
  // 检查是否放在标签页上
  const tabItem = e.target.closest('.tab-item');
  if (tabItem) {
    const targetTabId = parseInt(tabItem.dataset.tabId);
    if (targetTabId === draggedTabId) return;
    
    const targetIndex = parseInt(tabItem.dataset.index);
    const targetGroupId = parseInt(tabItem.dataset.groupId) || -1;
    const rect = tabItem.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    
    // 计算目标位置
    let newIndex = e.clientY < midY ? targetIndex : targetIndex + 1;
    
    // 移动标签页
    await chrome.runtime.sendMessage({
      type: 'MOVE_TAB',
      tabId: draggedTabId,
      targetIndex: newIndex,
      targetGroupId: targetGroupId !== draggedTabGroupId ? targetGroupId : undefined
    });
  }
  
  // 检查是否放在未分组区域
  const ungroupedSection = e.target.closest('.ungrouped-section');
  if (ungroupedSection && !tabItem && draggedTabGroupId !== -1) {
    await chrome.runtime.sendMessage({
      type: 'MOVE_TAB',
      tabId: draggedTabId,
      targetGroupId: -1
    });
  }
}

// 启动
init();

