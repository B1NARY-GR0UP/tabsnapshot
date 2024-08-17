/**
 * Copyright 2024 BINARY Members
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

document.addEventListener('DOMContentLoaded', function() {
    var snapshotList = document.getElementById('snapshotList');

    var createSnapshotButton = document.getElementById('createSnapshot');
    var exportSnapshotsButton = document.getElementById('exportSnapshots');
    var importSnapshotsButton = document.getElementById('importSnapshots');
    var fileInput = document.getElementById('fileInput');

    createSnapshotButton.addEventListener('click', function() {
        chrome.tabs.query({}, function(tabs) {
            var snapshot = { tabs: tabs };
            chrome.runtime.sendMessage({ action: 'saveSnapshot', snapshot: snapshot });
        });
    });

    exportSnapshotsButton.addEventListener('click', function() {
        chrome.storage.local.get('snapshots', function(result) {
            var snapshots = result.snapshots || [];
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshots));
            var downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "snapshots.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    });

    importSnapshotsButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            var importedSnapshots = JSON.parse(e.target.result);
            chrome.storage.local.get('snapshots', function(result) {
                var currentSnapshots = result.snapshots || [];

                importedSnapshots.forEach(function(importedSnapshot) {
                    var index = currentSnapshots.findIndex(function(snapshot) {
                        return snapshot.time === importedSnapshot.time;
                    });

                    if (index !== -1) {
                        currentSnapshots[index] = importedSnapshot;
                    } else {
                        currentSnapshots.push(importedSnapshot);
                    }
                });

                chrome.storage.local.set({ snapshots: currentSnapshots }, function() {
                    chrome.runtime.sendMessage({ action: 'updateList', snapshots: currentSnapshots });
                    updateSnapshotList(currentSnapshots);
                });
            });
        };
        reader.readAsText(file);
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'updateList') {
            snapshotList.innerHTML = '';
        }
        request.snapshots.forEach(function(snapshot) {
            var listItem = createSnapshotListItem(snapshot);
            snapshotList.appendChild(listItem);
        });
    });

    chrome.runtime.sendMessage({ action: 'getSnapshots' });

    function updateSnapshotList(snapshots) {
        snapshotList.innerHTML = '';
        snapshots.forEach(function(snapshot) {
            var listItem = createSnapshotListItem(snapshot);
            snapshotList.appendChild(listItem);
        });
    }

    function previewSnapshot(snapshot) {
        var screenWidth = window.screen.width;
        var screenHeight = window.screen.height;
        var windowWidth = 300;
        var windowHeight = 300;

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

        previewWindow.document.title = 'Snapshot Preview';
        previewWindow.document.body.appendChild(previewContent);
    }

    function createSnapshotListItem(snapshot) {
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
        renameButton.className = 'yellow-button';

        var updateButton = document.createElement('button');
        updateButton.textContent = 'Update';
        updateButton.className = 'blue-button';

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

        updateButton.addEventListener('click', function(event) {
            event.stopPropagation();
            chrome.tabs.query({}, function(tabs) {
                var updatedSnapshot = { tabs: tabs };
                chrome.runtime.sendMessage({ action: 'updateSnapshot', snapshot: snapshot, updatedSnapshot: updatedSnapshot });
            });
        });

        deleteButton.addEventListener('click', function(event) {
            event.stopPropagation();
            chrome.runtime.sendMessage({ action: 'deleteSnapshot', snapshot: snapshot });
        });

        snapshotText.addEventListener('click', function(event) {
            event.stopPropagation();
            previewSnapshot(snapshot);
        });

        listItem.appendChild(snapshotText);
        listItem.appendChild(tabCount);
        listItem.appendChild(openButton);
        listItem.appendChild(renameButton);
        listItem.appendChild(updateButton);
        listItem.appendChild(deleteButton);

        snapshotText.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                snapshotText.contentEditable = false;
                chrome.runtime.sendMessage({ action: 'renameSnapshot', snapshot: snapshot, newName: snapshotText.textContent });
            }
        });

        return listItem;
    }
});
