/**
 * Copyright 2023 BINARY Members
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

// TODO: export and import snapshots (need decision)
chrome.runtime.onInstalled.addListener(function() {
    // init snapshot list when extension installed
    chrome.storage.local.set({ snapshots: [] });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'saveSnapshot') {
        // get snapshot list
        chrome.storage.local.get('snapshots', function(result) {
            var snapshots = result.snapshots || [];
            var currentTime = new Date();
            var formattedTime = currentTime.getMonth() + 1 + '/' + currentTime.getDate() + ' ' +
                currentTime.getHours() + ':' + currentTime.getMinutes();
            var snapshotName = formattedTime;

            var sameMinuteSnapshots = snapshots.filter(function(existingSnapshot) {
                return existingSnapshot.time.startsWith(formattedTime);
            });

            if (sameMinuteSnapshots.length > 0) {
                snapshotName = formattedTime + ' (' + (sameMinuteSnapshots.length + 1) + ')';
            }

            var newSnapshot = { time: snapshotName, tabs: request.snapshot.tabs };
            snapshots.push(newSnapshot);
            chrome.storage.local.set({ snapshots: snapshots }, function() {
                chrome.runtime.sendMessage({ action: 'updateList', snapshots: snapshots });
            });
        });
    } else if (request.action === 'getSnapshots') {
        // get and send snapshot list to popup.js
        chrome.storage.local.get('snapshots', function(result) {
            var snapshots = result.snapshots || [];
            chrome.runtime.sendMessage({ action: 'updateList', snapshots: snapshots });
        });
    } else if (request.action === 'restoreSnapshot') {
        // request.snapshot include the information of clicked snapshot item. use tabs of snapshot to visit the link
        request.snapshot.tabs.forEach(function(tab) {
            if (tab.url.startsWith('file:///')) {
                // refresh tab if it's local file
                chrome.tabs.create({ url: tab.url }, function(newTab) {
                    // add flag to ensure that only refresh on the first load
                    let isFirstLoad = true;
                    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, updatedTab) {
                        if (tabId === newTab.id && changeInfo.status === 'complete' && isFirstLoad) {
                            isFirstLoad = false;
                            chrome.tabs.reload(tabId);
                        }
                    });
                });
            } else {
                // visit link if not local file
                chrome.tabs.create({ url: tab.url });
            }
        });
    } else if (request.action === 'deleteSnapshot') {
        // get snapshot list
        chrome.storage.local.get('snapshots', function(result) {
            var snapshots = result.snapshots || [];
            // find delete snapshot
            var index = snapshots.findIndex(function(snapshot) {
                return snapshot.time === request.snapshot.time;
            });
            // if find, remove it from list
            if (index !== -1) {
                snapshots.splice(index, 1);
                // save updated list
                chrome.storage.local.set({ snapshots: snapshots }, function() {
                    chrome.runtime.sendMessage({ action: 'updateList', snapshots: snapshots });
                });
            }
        });
    } else if (request.action === 'renameSnapshot') {
        chrome.storage.local.get('snapshots', function(result) {
            var snapshots = result.snapshots || [];
            // find rename snapshot
            var index = snapshots.findIndex(function(snapshot) {
                return snapshot.time === request.snapshot.time;
            });
            // if find, rename it
            if (index !== -1) {
                snapshots[index].time = request.newName;
                // save updated list
                chrome.storage.local.set({ snapshots: snapshots }, function() {
                    chrome.runtime.sendMessage({ action: 'updateList', snapshots: snapshots });
                });
            }
        });
    } else if (request.action === 'openAllSnapshots') {
        // get and open all snapshots
        chrome.storage.local.get('snapshots', function(result) {
            var snapshots = result.snapshots || [];
            snapshots.forEach(function(snapshot) {
                snapshot.tabs.forEach(function(tab) {
                    chrome.tabs.create({ url: tab.url });
                });
            });
        });
    } else if (request.action === 'deleteAllSnapshots') {
        // remove all snapshots
        chrome.storage.local.set({ snapshots: [] }, function() {
            chrome.runtime.sendMessage({ action: 'updateList', snapshots: [] });
        });
    }
});
