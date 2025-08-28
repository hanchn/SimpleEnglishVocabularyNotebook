// Chrome插件后台服务
chrome.runtime.onInstalled.addListener(() => {
  console.log('英语单词记忆本插件已安装');
});

// 处理插件图标点击
chrome.action.onClicked.addListener((tab) => {
  // 可以在这里添加额外的逻辑
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabInfo') {
    sendResponse({url: sender.tab?.url});
  }
});