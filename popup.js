document.addEventListener('DOMContentLoaded', function() {
    var createSnapshotButton = document.getElementById('createSnapshot');
    var snapshotList = document.getElementById('snapshotList');

    createSnapshotButton.addEventListener('click', function() {
        chrome.tabs.query({}, function(tabs) {
            var snapshot = { time: new Date().toLocaleString(), tabs: tabs };
            chrome.runtime.sendMessage({ action: 'saveSnapshot', snapshot: snapshot });
        });
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'updateList') {
            snapshotList.innerHTML = '';
            request.snapshots.forEach(function(snapshot) {
                var listItem = document.createElement('li');
                listItem.textContent = snapshot.time;
                listItem.addEventListener('click', function() {
                    // 在这里实现打开快照中所有链接的逻辑
                    chrome.runtime.sendMessage({ action: 'restoreSnapshot', snapshot: snapshot });
                });
                snapshotList.appendChild(listItem);
            });
        }
    });

    chrome.runtime.sendMessage({ action: 'getSnapshots' });
});
