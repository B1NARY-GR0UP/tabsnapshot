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
                var listItem = document.createElement('div');
                listItem.className = 'snapshot-item';

                var snapshotText = document.createElement('span');
                snapshotText.className = 'snapshot-text';
                snapshotText.textContent = snapshot.time;

                var renameButton = document.createElement('button');
                renameButton.textContent = 'Rename';
                renameButton.className = 'rename-button';

                // 添加重命名按钮的点击事件
                renameButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    snapshotText.contentEditable = true;
                    snapshotText.focus();
                });

                var deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete-button';

                // 添加删除按钮的点击事件
                deleteButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    // 向background.js发送删除快照的请求
                    chrome.runtime.sendMessage({ action: 'deleteSnapshot', snapshot: snapshot });
                });

                listItem.appendChild(snapshotText);
                listItem.appendChild(renameButton);
                listItem.appendChild(deleteButton);

                listItem.addEventListener('click', function() {
                    chrome.runtime.sendMessage({ action: 'restoreSnapshot', snapshot: snapshot });
                });
                snapshotList.appendChild(listItem);

                // 添加快照文本的编辑完成事件
                snapshotText.addEventListener('blur', function() {
                    snapshotText.contentEditable = false;
                    // 发送重命名请求到background.js
                    chrome.runtime.sendMessage({ action: 'renameSnapshot', snapshot: snapshot, newName: snapshotText.textContent });
                });
            });
        }
    });

    chrome.runtime.sendMessage({ action: 'getSnapshots' });
});
