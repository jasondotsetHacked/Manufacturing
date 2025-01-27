import { db, saveTabs, loadTabs, saveGameData, loadGameData } from './db.js';
import { updateResourceList } from './resources.js';

export let activeTab = null;
export const games = {};

export function initTabs() {
  loadTabs((tabs) => {
    if (tabs.length === 0) {
      const defaultName = 'default';
      games[defaultName] = { resources: [] };
      saveGameData(defaultName, games[defaultName]);
      saveTabs([defaultName]);
      createTabElement(defaultName);
      activateTab(defaultName);
      updateResourceList();
    } else {
      tabs.forEach((tabName) => {
        createTabElement(tabName);
        games[tabName] = { resources: [] };
      });
      const firstTab = tabs[0];
      activateTab(firstTab);
      loadGameData(firstTab, (data) => {
        games[firstTab] = data;
        updateResourceList();
      });
    }
  });

  document.querySelector('.add-tab').addEventListener('click', addTab);

  document.querySelector('.tabs').addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-tab')) {
      event.stopPropagation();
      const tabDiv = event.target.closest('.tab');
      const oldName = tabDiv.dataset.tab;
      if (event.target.textContent === '✎') {
        startRenameTab(event, oldName);
      } else {
        finishRenameTab(event, oldName);
      }
    } else if (event.target.closest('.tab')) {
      switchTab(event);
    }
  });
}

function addTab() {
  const newTabName = `Tab ${Date.now()}`;
  games[newTabName] = { resources: [] };
  saveGameData(newTabName, games[newTabName]);
  const allTabNames = Object.keys(games);
  saveTabs(allTabNames);
  createTabElement(newTabName);
  activateTab(newTabName);
  updateResourceList();
}

function createTabElement(tabName) {
  const newTab = document.createElement('div');
  newTab.className = 'tab';
  newTab.dataset.tab = tabName;
  newTab.innerHTML = `<span>${tabName}</span><button class='edit-tab'>✎</button>`;
  const addTabBtn = document.querySelector('.add-tab');
  document.querySelector('.tabs').insertBefore(newTab, addTabBtn);
}

function switchTab(event) {
  const clickedTab = event.target.closest('.tab');
  if (!clickedTab) return;
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
  clickedTab.classList.add('active');
  activeTab = clickedTab.dataset.tab;
  loadGameData(activeTab, (data) => {
    games[activeTab] = data;
    updateResourceList();
  });
}

function activateTab(tabName) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.remove('active');
  });
  const newlyCreatedTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (newlyCreatedTab) {
    newlyCreatedTab.classList.add('active');
  }
  activeTab = tabName;
}

function startRenameTab(event, oldName) {
  event.stopPropagation();
  const tabElement = event.target.closest('.tab');
  const spanElement = tabElement.querySelector('span');
  const editButton = event.target;
  const inputElement = document.createElement('input');
  inputElement.type = 'text';
  inputElement.value = oldName;
  inputElement.className = 'tab-input';
  spanElement.replaceWith(inputElement);
  editButton.textContent = '💾';
  inputElement.focus();
}

function finishRenameTab(event, oldName) {
  event.stopPropagation();
  const tabElement = event.target.closest('.tab');
  const inputElement = tabElement.querySelector('.tab-input');
  const editButton = event.target;
  const newName = inputElement.value.trim();
  if (!newName || newName === oldName) {
    revertRename(tabElement, oldName);
    return;
  }
  if (games[newName]) {
    alert(`A tab named "${newName}" already exists. Please choose a different name.`);
    revertRename(tabElement, oldName);
    return;
  }
  doRename(oldName, newName, tabElement, inputElement, editButton);
}

function doRename(oldName, newName, tabElement, inputElement, editButton) {
  const oldData = games[oldName] || { resources: [] };
  games[newName] = oldData;
  delete games[oldName];

  const transaction = db.transaction(['games'], 'readwrite');
  const store = transaction.objectStore('games');
  store.put({ name: newName, resources: oldData.resources || [] });
  store.delete(oldName);

  tabElement.dataset.tab = newName;
  const spanElement = document.createElement('span');
  spanElement.textContent = newName;
  inputElement.replaceWith(spanElement);
  editButton.textContent = '✎';

  if (activeTab === oldName) {
    activeTab = newName;
  }
  saveTabs(Object.keys(games));
  updateResourceList();
}

function revertRename(tabElement, oldName) {
  const inputElement = tabElement.querySelector('.tab-input');
  const editButton = tabElement.querySelector('.edit-tab');
  const spanElement = document.createElement('span');
  spanElement.textContent = oldName;
  inputElement.replaceWith(spanElement);
  editButton.textContent = '✎';
}