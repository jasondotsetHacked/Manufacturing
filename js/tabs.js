import { db, saveTabs, loadTabs, saveGameData, loadGameData } from './db.js';
import { updateResourceList } from './resources.js';
import { updateJobList } from './jobs.js';

export let activeTab = 'default';
// Holds in-memory data for each tab
export const games = {
  default: {
    resources: [],
    jobs: []
  }
};

export function initTabs() {
  // Set up the main event listeners
  document.querySelector('.add-tab').addEventListener('click', addTab);
  document.querySelector('.tabs').addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-tab')) {
      // Rename action
      renameTab(event, event.target.closest('.tab').dataset.tab);
      event.stopPropagation();
    } else if (event.target.closest('.tab')) {
      // Switch tab action
      switchTab(event);
    }
  });

  // Load any stored tabs from IndexedDB
  loadTabs((tabs) => {
    // Create a tab button for each stored tab name
    tabs.forEach((tabName) => {
      // Skip "default" if it’s already in memory
      if (tabName !== 'default') {
        createTabElement(tabName);
        if (!games[tabName]) {
          games[tabName] = { resources: [], jobs: [] };
        }
      }
    });
    // Load data for the default tab
    loadGameData('default', (data) => {
      games['default'] = data;
      updateResourceList();
      updateJobList();
    });
  });
}

/**
 * Add a brand-new tab.
 */
function addTab() {
  const newTabName = `Tab ${Date.now()}`; // Unique name based on timestamp
  // Create the visual tab element
  createTabElement(newTabName);

  // Initialize empty data in memory for this tab
  games[newTabName] = { resources: [], jobs: [] };

  // Save it to IndexedDB
  saveGameData(newTabName, games[newTabName]);
  // Update 'tabs' list in IndexedDB
  saveTabs(Object.keys(games));

  // Automatically switch to the new tab
  activateTab(newTabName);
  updateResourceList();
  updateJobList();
}

/**
 * Creates the actual <div class="tab"> element in the .tabs container.
 */
function createTabElement(tabName) {
  const newTab = document.createElement('div');
  newTab.className = 'tab';
  newTab.dataset.tab = tabName;
  newTab.innerHTML = `<span>${tabName}</span><button class='edit-tab'>✎</button>`;
  document.querySelector('.tabs').insertBefore(newTab, document.querySelector('.add-tab'));
}

/**
 * Switches the active tab based on user click.
 */
function switchTab(event) {
  const clickedTab = event.target.closest('.tab');
  if (!clickedTab) return;

  // Remove "active" from all tabs
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));

  // Add "active" to the clicked tab
  clickedTab.classList.add('active');
  activeTab = clickedTab.dataset.tab;

  // Load the data from IndexedDB for that tab
  loadGameData(activeTab, (data) => {
    games[activeTab] = data;
    updateResourceList();
    updateJobList();
  });
}

/**
 * Helper to programmatically set a tab as active (used after creation).
 */
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

/**
 * Begins renaming a tab by swapping its <span> to an <input>.
 */
function renameTab(event, oldName) {
  const tabElement = event.target.closest('.tab');
  const spanElement = tabElement.querySelector('span');
  const editButton = event.target;

  // Replace text span with an input for editing
  const inputElement = document.createElement('input');
  inputElement.type = 'text';
  inputElement.value = oldName;
  inputElement.className = 'tab-input';

  spanElement.replaceWith(inputElement);
  editButton.textContent = '💾'; // Save icon

  // Temporarily override the button's click to "save" instead of "rename"
  editButton.onclick = (e) => {
    saveTabName(e, oldName);
  };
}

/**
 * Final step of renaming (saving the new tab name to DB).
 */
function saveTabName(event, oldName) {
  const tabElement = event.target.closest('.tab');
  const inputElement = tabElement.querySelector('.tab-input');
  const editButton = event.target;
  const newName = inputElement.value.trim();

  if (!newName || newName === oldName) {
    // Either the name didn't change, or is empty => revert
    revertRename(tabElement, oldName);
    return;
  }

  // Merge old data to the new tab name
  const oldData = games[oldName] || { resources: [], jobs: [] };

  // Remove old record from DB, store under new name
  const transaction = db.transaction(['games'], 'readwrite');
  const store = transaction.objectStore('games');
  store.delete(oldName);
  store.put({ name: newName, ...oldData });

  // Update in-memory references
  games[newName] = oldData;
  delete games[oldName];

  // Update tab's dataset
  tabElement.dataset.tab = newName;

  // Revert the input back to a <span> with the new name
  const spanElement = document.createElement('span');
  spanElement.textContent = newName;
  inputElement.replaceWith(spanElement);

  // Restore the button to an edit button
  editButton.textContent = '✎';
  editButton.onclick = (e) => renameTab(e, newName);

  // Update "activeTab"
  activeTab = newName;

  // Persist new "tabs" list to DB
  saveTabs(Object.keys(games));

  // Refresh resource/job lists with the new name
  updateResourceList();
  updateJobList();
}

/**
 * If the user cancels or if the new name is invalid, just revert to the old name.
 */
function revertRename(tabElement, oldName) {
  const inputElement = tabElement.querySelector('.tab-input');
  const editButton = tabElement.querySelector('.edit-tab');

  const spanElement = document.createElement('span');
  spanElement.textContent = oldName;
  inputElement.replaceWith(spanElement);

  // Restore the button to an edit button
  editButton.textContent = '✎';
  editButton.onclick = (e) => renameTab(e, oldName);
}
