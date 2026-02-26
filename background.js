// 标签页访问历史（按窗口存储）
const tabHistory = new Map(); // windowId -> [tabId, tabId, ...]
const MAX_HISTORY = 50;

// 扩展安装时设置侧边栏行为
chrome.runtime.onInstalled.addListener(() => {
  // 设置点击扩展图标时自动打开侧边栏
  // 这样快捷键 _execute_action 也会触发打开侧边栏
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// 监听标签页激活，记录访问历史
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  if (!tabHistory.has(windowId)) {
    tabHistory.set(windowId, []);
  }
  
  const history = tabHistory.get(windowId);
  
  // 移除已存在的相同 tabId（避免重复）
  const existingIndex = history.indexOf(tabId);
  if (existingIndex !== -1) {
    history.splice(existingIndex, 1);
  }
  
  // 添加到历史最前面
  history.unshift(tabId);
  
  // 限制历史长度
  if (history.length > MAX_HISTORY) {
    history.pop();
  }
});

// 标签页关闭时从历史中移除
chrome.tabs.onRemoved.addListener((tabId, { windowId }) => {
  if (tabHistory.has(windowId)) {
    const history = tabHistory.get(windowId);
    const index = history.indexOf(tabId);
    if (index !== -1) {
      history.splice(index, 1);
    }
  }
});

// 窗口关闭时清理历史
chrome.windows.onRemoved.addListener((windowId) => {
  tabHistory.delete(windowId);
});

// 监听来自侧边栏的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TABS') {
    handleGetTabs(message.windowId).then(sendResponse);
    return true; // 保持消息通道开放
  }
  
  if (message.type === 'SWITCH_TAB') {
    chrome.tabs.update(message.tabId, { active: true });
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'SWITCH_TO_PREVIOUS_TAB') {
    handleSwitchToPreviousTab(message.windowId).then(sendResponse);
    return true;
  }
  
  if (message.type === 'CLOSE_TAB') {
    chrome.tabs.remove(message.tabId).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
  
  if (message.type === 'CLOSE_OTHER_TABS') {
    handleCloseOtherTabs(message.tabId, message.windowId).then(sendResponse);
    return true;
  }
  
  if (message.type === 'CLOSE_TABS_TO_RIGHT') {
    handleCloseTabsToRight(message.tabId, message.windowId).then(sendResponse);
    return true;
  }
  
  if (message.type === 'TOGGLE_PIN') {
    chrome.tabs.get(message.tabId, (tab) => {
      chrome.tabs.update(message.tabId, { pinned: !tab.pinned }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (message.type === 'RELOAD_TAB') {
    chrome.tabs.reload(message.tabId).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.type === 'DUPLICATE_TAB') {
    chrome.tabs.duplicate(message.tabId).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.type === 'TOGGLE_GROUP_COLLAPSED') {
    chrome.tabGroups.update(message.groupId, { 
      collapsed: message.collapsed 
    }).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
  
  if (message.type === 'ADD_TAB_TO_GROUP') {
    handleAddTabToGroup(message.tabId, message.groupId).then(sendResponse);
    return true;
  }
  
  if (message.type === 'ADD_TABS_TO_GROUP') {
    handleAddTabsToGroup(message.tabIds, message.groupId).then(sendResponse);
    return true;
  }
  
  if (message.type === 'CREATE_GROUP_WITH_TAB') {
    handleCreateGroupWithTab(message.tabId, message.title, message.color).then(sendResponse);
    return true;
  }
  
  if (message.type === 'CREATE_GROUP_WITH_TABS') {
    handleCreateGroupWithTabs(message.tabIds, message.title, message.color).then(sendResponse);
    return true;
  }
  
  if (message.type === 'REMOVE_TAB_FROM_GROUP') {
    chrome.tabs.ungroup(message.tabId).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
  
  if (message.type === 'MOVE_TAB') {
    handleMoveTab(message.tabId, message.targetIndex, message.targetGroupId).then(sendResponse);
    return true;
  }
  
  // 分组操作
  if (message.type === 'RENAME_GROUP') {
    chrome.tabGroups.update(message.groupId, { title: message.title }).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
  
  if (message.type === 'CHANGE_GROUP_COLOR') {
    chrome.tabGroups.update(message.groupId, { color: message.color }).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
  
  if (message.type === 'CLOSE_GROUP_TABS') {
    handleCloseGroupTabs(message.groupId).then(sendResponse);
    return true;
  }
  
  if (message.type === 'UNGROUP') {
    handleUngroup(message.groupId).then(sendResponse);
    return true;
  }
  
  if (message.type === 'MOVE_GROUP') {
    handleMoveGroup(message.groupId, message.targetIndex).then(sendResponse);
    return true;
  }
});

// 获取所有标签页和分组信息
async function handleGetTabs(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    const groups = await chrome.tabGroups.query({ windowId });
    
    // 创建分组映射
    const groupMap = {};
    groups.forEach(group => {
      groupMap[group.id] = {
        id: group.id,
        title: group.title || '未命名分组',
        color: group.color,
        collapsed: group.collapsed,
        tabs: [],
        firstTabIndex: Infinity // 用于排序
      };
    });
    
    // 未分组的标签页
    const ungroupedTabs = [];
    
    // 将标签页分配到各组
    tabs.forEach(tab => {
      const tabInfo = {
        id: tab.id,
        title: tab.title || '新标签页',
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        active: tab.active,
        pinned: tab.pinned,
        groupId: tab.groupId,
        index: tab.index
      };
      
      if (tab.groupId && tab.groupId !== -1 && groupMap[tab.groupId]) {
        groupMap[tab.groupId].tabs.push(tabInfo);
        // 记录分组中第一个标签页的索引（用于排序）
        if (tab.index < groupMap[tab.groupId].firstTabIndex) {
          groupMap[tab.groupId].firstTabIndex = tab.index;
        }
      } else {
        ungroupedTabs.push(tabInfo);
      }
    });
    
    // 按第一个标签页的索引对分组进行排序
    const sortedGroups = Object.values(groupMap).sort((a, b) => a.firstTabIndex - b.firstTabIndex);
    
    return {
      success: true,
      groups: sortedGroups,
      ungroupedTabs,
      totalCount: tabs.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 关闭其他标签页
async function handleCloseOtherTabs(tabId, windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    const tabsToClose = tabs.filter(tab => tab.id !== tabId && !tab.pinned);
    await Promise.all(tabsToClose.map(tab => chrome.tabs.remove(tab.id)));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 关闭右侧标签页
async function handleCloseTabsToRight(tabId, windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    const currentTab = tabs.find(tab => tab.id === tabId);
    if (!currentTab) return { success: false, error: 'Tab not found' };
    
    const tabsToClose = tabs.filter(tab => tab.index > currentTab.index && !tab.pinned);
    await Promise.all(tabsToClose.map(tab => chrome.tabs.remove(tab.id)));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 将标签页添加到已有分组
async function handleAddTabToGroup(tabId, groupId) {
  try {
    await chrome.tabs.group({ tabIds: tabId, groupId });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 将多个标签页添加到已有分组
async function handleAddTabsToGroup(tabIds, groupId) {
  try {
    await chrome.tabs.group({ tabIds, groupId });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 创建新分组并添加标签页
async function handleCreateGroupWithTab(tabId, title, color) {
  try {
    const groupId = await chrome.tabs.group({ tabIds: tabId });
    await chrome.tabGroups.update(groupId, { 
      title: title || '新分组',
      color: color || 'blue'
    });
    return { success: true, groupId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 创建新分组并添加多个标签页
async function handleCreateGroupWithTabs(tabIds, title, color) {
  try {
    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, {
      title: title || '新分组',
      color: color || 'blue'
    });
    return { success: true, groupId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 移动标签页位置
async function handleMoveTab(tabId, targetIndex, targetGroupId) {
  try {
    // 先移动标签页位置
    if (targetIndex !== undefined && targetIndex !== -1) {
      await chrome.tabs.move(tabId, { index: targetIndex });
    }
    
    // 处理分组
    if (targetGroupId !== undefined) {
      if (targetGroupId === -1) {
        // 移出分组
        await chrome.tabs.ungroup(tabId);
      } else {
        // 移入分组
        await chrome.tabs.group({ tabIds: tabId, groupId: targetGroupId });
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 关闭分组中的所有标签页
async function handleCloseGroupTabs(groupId) {
  try {
    const tabs = await chrome.tabs.query({ groupId });
    const tabIds = tabs.map(tab => tab.id);
    if (tabIds.length > 0) {
      await chrome.tabs.remove(tabIds);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 取消分组（保留标签页）
async function handleUngroup(groupId) {
  try {
    const tabs = await chrome.tabs.query({ groupId });
    const tabIds = tabs.map(tab => tab.id);
    if (tabIds.length > 0) {
      await chrome.tabs.ungroup(tabIds);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 切换到上一次访问的标签页
async function handleSwitchToPreviousTab(windowId) {
  try {
    const history = tabHistory.get(windowId);
    if (!history || history.length < 2) {
      return { success: false, error: 'No previous tab' };
    }
    
    // history[0] 是当前标签页，history[1] 是上一次访问的标签页
    const previousTabId = history[1];
    
    // 检查标签页是否存在
    try {
      await chrome.tabs.get(previousTabId);
      await chrome.tabs.update(previousTabId, { active: true });
      return { success: true, tabId: previousTabId };
    } catch {
      // 标签页不存在，从历史中移除并尝试下一个
      history.splice(1, 1);
      return handleSwitchToPreviousTab(windowId);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 移动分组到指定位置
async function handleMoveGroup(groupId, targetIndex) {
  try {
    // 获取分组中的所有标签页
    const tabs = await chrome.tabs.query({ groupId });
    if (tabs.length === 0) {
      return { success: false, error: 'Group has no tabs' };
    }
    
    // 按索引排序
    tabs.sort((a, b) => a.index - b.index);
    
    // 移动所有标签页到目标位置
    const tabIds = tabs.map(tab => tab.id);
    await chrome.tabs.move(tabIds, { index: targetIndex });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

