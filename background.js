var snapshots = [];

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'saveSnapshot') {
        snapshots.push(request.snapshot);
        chrome.runtime.sendMessage({ action: 'updateList', snapshots: snapshots });
    } else if (request.action === 'getSnapshots') {
        chrome.runtime.sendMessage({ action: 'updateList', snapshots: snapshots });
    } else if (request.action === 'restoreSnapshot') {
        chrome.tabs.create({ url: request.snapshot.tabs[0].url });
    }
});
