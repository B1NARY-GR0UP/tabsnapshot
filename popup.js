document.addEventListener('DOMContentLoaded', function() {
    var snapshotList = document.getElementById('snapshotList');

    var createSnapshotButton = document.getElementById('createSnapshot');
    var openAllButton = document.getElementById('openAll');
    var deleteAllButton = document.getElementById('deleteAll');

    createSnapshotButton.addEventListener('click', function() {
        chrome.tabs.query({}, function(tabs) {
            var snapshot = { tabs: tabs };
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

                openButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    chrome.runtime.sendMessage({ action: 'restoreSnapshot', snapshot: snapshot });
                });

                renameButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    snapshotText.contentEditable = true;
                    snapshotText.focus();
                });

                deleteButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    // send delete snapshot request to background.js
                    chrome.runtime.sendMessage({ action: 'deleteSnapshot', snapshot: snapshot });
                });

                // add preview event
                snapshotText.addEventListener('click', function(event) {
                    event.stopPropagation();
                    previewSnapshot(snapshot);
                });

                listItem.appendChild(snapshotText);
                listItem.appendChild(tabCount);
                listItem.appendChild(openButton);
                listItem.appendChild(renameButton);
                listItem.appendChild(deleteButton);

                // edit accomplish event
                snapshotText.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter') {
                        snapshotText.contentEditable = false;
                        // send rename request
                        chrome.runtime.sendMessage({ action: 'renameSnapshot', snapshot: snapshot, newName: snapshotText.textContent });
                    }
                });

                snapshotList.appendChild(listItem);
            });
        }
    });

    chrome.runtime.sendMessage({ action: 'getSnapshots' });

    function previewSnapshot(snapshot) {
        var screenWidth = window.screen.width;
        var screenHeight = window.screen.height;
        var windowWidth = 300; // preview window width
        var windowHeight = 300; // preview window height

        var left = (screenWidth - windowWidth) / 2;
        var top = (screenHeight - windowHeight) / 2;

        var previewWindow = window.open('', '_blank', 'width=' + windowWidth + ',height=' + windowHeight + ',left=' + left + ',top=' + top + ',scrollbars=yes,resizable=yes');
        var previewContent = document.createElement('ul');

        snapshot.tabs.forEach(function(tab) {
            var listItem = document.createElement('li');
            var link = document.createElement('a');
            link.href = tab.url;
            link.target = '_blank';
            link.textContent = tab.title || tab.url;
            listItem.appendChild(link);
            previewContent.appendChild(listItem);
        });

        previewWindow.document.title = 'Snapshot Preview'; // preview window title
        previewWindow.document.body.appendChild(previewContent);
    }
});
