import { db, saveTabs, loadTabs, saveGameData, loadGameData } from './db.js';
import { updateResourceList } from './resources.js';
import { updateJobList } from './jobs.js';

export let activeTab = 'default';
export const games = { default: { resources: [], jobs: [] } };

export function initTabs() {
    document.querySelector('.add-tab').addEventListener('click', addTab);
    document.querySelector('.tabs').addEventListener('click', switchTab);
    loadTabs((tabs) => {
        tabs.forEach((tabName) => {
            if (tabName !== 'default') {
                createTabElement(tabName);
                games[tabName] = { resources: [], jobs: [] };
            }
        });
    });
}

function addTab() {
    const newTabName = `Tab ${document.querySelectorAll('.tab').length}`;
    createTabElement(newTabName);
    games[newTabName] = { resources: [], jobs: [] };
    saveGameData(newTabName, games[newTabName]);
    saveTabs(Object.keys(games));
}

function createTabElement(tabName) {
    const newTab = document.createElement('div');
    newTab.className = 'tab';
    newTab.dataset.tab = tabName;
    newTab.innerHTML = `<span>${tabName}</span><button class='edit-tab'>✎</button>`;
    document.querySelector('.tabs').insertBefore(newTab, document.querySelector('.add-tab'));
}

function switchTab(event) {
    if (event.target.closest('.tab')) {
        document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
        const tabElement = event.target.closest('.tab');
        tabElement.classList.add('active');
        activeTab = tabElement.dataset.tab;
        loadGameData(activeTab, (data) => {
            games[activeTab] = data;
            updateResourceList();
            updateJobList();
        });
    }
}

document.querySelector('.tabs').addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-tab')) {
        renameTab(event, event.target.closest('.tab').dataset.tab);
    }
});

function renameTab(event, tabName) {
    const tabElement = event.target.closest('.tab');
    const spanElement = tabElement.querySelector('span');
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.value = tabName;
    inputElement.className = 'tab-input';

    spanElement.replaceWith(inputElement);
    event.target.textContent = '💾';
    event.target.onclick = (e) => saveTabName(e, tabName);
}

function saveTabName(event, oldName) {
    const tabElement = event.target.closest('.tab');
    const inputElement = tabElement.querySelector('.tab-input');
    const newName = inputElement.value.trim();

    if (newName && newName !== oldName) {
        const transaction = db.transaction(['games'], 'readwrite');
        const store = transaction.objectStore('games');
        store.delete(oldName);
        store.put({ name: newName, ...games[oldName] });
        delete games[oldName];
        games[newName] = { resources: [], jobs: [] };
        tabElement.dataset.tab = newName;
        activeTab = newName;

        const spanElement = document.createElement('span');
        spanElement.textContent = newName;
        inputElement.replaceWith(spanElement);
        event.target.textContent = '✎';
        event.target.onclick = (e) => renameTab(e, newName);

        saveTabs(Object.keys(games));
    }
}
