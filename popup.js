document.addEventListener('DOMContentLoaded', function() {
    var snapshotList = document.getElementById('snapshotList');

    var createSnapshotButton = document.getElementById('createSnapshot');
    var openAllButton = document.getElementById('openAll');
    var deleteAllButton = document.getElementById('deleteAll');

    createSnapshotButton.addEventListener('click', function() {
        chrome.tabs.query({}, function(tabs) {
            var currentTime = new Date();
            var formattedTime = currentTime.getMonth() + 1 + '/' + currentTime.getDate() + ' ' +
                currentTime.getHours() + ':' + currentTime.getMinutes();
            var snapshot = { time: formattedTime, tabs: tabs };
            chrome.runtime.sendMessage({ action: 'saveSnapshot', snapshot: snapshot });
        });
    });

    openAllButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'openAllSnapshots' });
    });

    deleteAllButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'deleteAllSnapshots' });
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

                var tabCount = document.createElement('span');
                tabCount.className = 'tab-count';
                tabCount.textContent = '[' + snapshot.tabs.length + ']';

                var openButton = document.createElement('button');
                openButton.textContent = 'Open';
                openButton.className = 'blue-button';

                var renameButton = document.createElement('button');
                renameButton.textContent = 'Rename';
                renameButton.className = 'blue-button';

                var deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'red-button';

                // 添加打开按钮的点击事件
                openButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    chrome.runtime.sendMessage({ action: 'restoreSnapshot', snapshot: snapshot });
                });

                // 添加重命名按钮的点击事件
                renameButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    snapshotText.contentEditable = true;
                    snapshotText.focus();
                });

                // 添加删除按钮的点击事件
                deleteButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    // 向background.js发送删除快照的请求
                    chrome.runtime.sendMessage({ action: 'deleteSnapshot', snapshot: snapshot });
                });

                listItem.appendChild(snapshotText);
                listItem.appendChild(tabCount);
                listItem.appendChild(openButton);
                listItem.appendChild(renameButton);
                listItem.appendChild(deleteButton);

                // 添加快照文本的编辑完成事件
                snapshotText.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter') {
                        snapshotText.contentEditable = false;
                        // 发送重命名请求到background.js
                        chrome.runtime.sendMessage({ action: 'renameSnapshot', snapshot: snapshot, newName: snapshotText.textContent });
                    }
                });

                snapshotList.appendChild(listItem);
            });
        }
    });

    chrome.runtime.sendMessage({ action: 'getSnapshots' });
});
