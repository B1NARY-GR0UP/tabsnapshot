chrome.runtime.onInstalled.addListener(function() {
    // 在插件安装时初始化快照列表
    chrome.storage.local.set({ snapshots: [] });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'saveSnapshot') {
        // 获取当前存储的快照数组
        chrome.storage.local.get('snapshots', function(result) {
            var snapshots = result.snapshots || [];
            snapshots.push(request.snapshot);
            // 保存更新后的快照数组
            chrome.storage.local.set({ snapshots: snapshots }, function() {
                chrome.runtime.sendMessage({ action: 'updateList', snapshots: snapshots });
            });
        });
    } else if (request.action === 'getSnapshots') {
        // 获取存储的快照数组并发送给popup.js
        chrome.storage.local.get('snapshots', function(result) {
            var snapshots = result.snapshots || [];
            chrome.runtime.sendMessage({ action: 'updateList', snapshots: snapshots });
        });
    } else if (request.action === 'restoreSnapshot') {
        // 在这里实现恢复快照的逻辑
        // request.snapshot 包含了被点击的快照的信息，可以使用其中的tabs数组来打开链接
        request.snapshot.tabs.forEach(function(tab) {
            chrome.tabs.create({ url: tab.url });
        });
    } else if (request.action === 'deleteSnapshot') {
        // 获取当前存储的快照数组
        chrome.storage.local.get('snapshots', function(result) {
            var snapshots = result.snapshots || [];
            // 在快照数组中查找要删除的快照
            var index = snapshots.findIndex(function(snapshot) {
                return snapshot.time === request.snapshot.time;
            });
            // 如果找到了要删除的快照，从数组中移除它
            if (index !== -1) {
                snapshots.splice(index, 1);
                // 保存更新后的快照数组
                chrome.storage.local.set({ snapshots: snapshots }, function() {
                    chrome.runtime.sendMessage({ action: 'updateList', snapshots: snapshots });
                });
            }
        });
    }
});
