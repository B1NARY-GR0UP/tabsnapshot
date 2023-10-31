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

                var deleteButton = document.createElement('span');
                deleteButton.textContent = 'x';
                deleteButton.className = 'delete-button';

                // 添加删除按钮的点击事件
                deleteButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    // 向background.js发送删除快照的请求
                    chrome.runtime.sendMessage({ action: 'deleteSnapshot', snapshot: snapshot });
                });

                listItem.appendChild(deleteButton);

                listItem.addEventListener('click', function() {
                    chrome.runtime.sendMessage({ action: 'restoreSnapshot', snapshot: snapshot });
                });
                snapshotList.appendChild(listItem);
            });
        }
    });

    chrome.runtime.sendMessage({ action: 'getSnapshots' });
});
