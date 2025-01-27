/********************************************
 * File: js/tabs.js (Updated to preserve data on rename)
 ********************************************/
import { db, saveTabs, loadTabs, saveGameData, loadGameData } from './db.js';
import { updateResourceList } from './resources.js';
import { updateJobList } from './jobs.js';

// Tracks the currently active tab name
export let activeTab = null;

// Holds in-memory data for each tab, keyed by tab name
export const games = {};

/**
 * Initializes tab logic, loads saved tab names from DB,
 * creates a default tab if needed, etc.
 */
export function initTabs() {
  // 1) Load the stored list of tabs (if any)
  loadTabs((tabs) => {
    // If no tabs exist, create a "default" tab in memory and DB
    if (tabs.length === 0) {
      const defaultName = 'default';
      games[defaultName] = { resources: [], jobs: [] };
      saveGameData(defaultName, games[defaultName]);     // Save to DB
      saveTabs([defaultName]);                           // Store "default" as the only tab

      // Create the DOM element for "default"
      createTabElement(defaultName);
      activateTab(defaultName);

      // Since we just created an empty default tab, no data to load
      updateResourceList();
      updateJobList();
    } else {
      // 2) We have existing tabs, so create DOM elements for each
      tabs.forEach((tabName) => {
        createTabElement(tabName);
        // Prepare in-memory entry; actual data will be loaded on switch
        games[tabName] = { resources: [], jobs: [] };
      });

      // 3) Activate the first tab in the list, load its data
      const firstTab = tabs[0];
      activateTab(firstTab);

      loadGameData(firstTab, (data) => {
        games[firstTab] = data;
        updateResourceList();
        updateJobList();
      });
    }
  });

  // Set up event listeners for adding tabs, renaming tabs, or switching tabs
  document.querySelector('.add-tab').addEventListener('click', addTab);

  document.querySelector('.tabs').addEventListener('click', (event) => {
    // If user clicked the "edit-tab" (pencil or save icon)
    if (event.target.classList.contains('edit-tab')) {
      // Stop the click from also triggering "switchTab"
      event.stopPropagation();
      const tabDiv = event.target.closest('.tab');
      const oldName = tabDiv.dataset.tab;

      if (event.target.textContent === '✎') {
        // Pencil icon => start rename
        renameTab(event, oldName);
      } else {
        // Save icon => finish renaming
        saveTabName(event, oldName);
      }
    }
    // If user clicked the tab span area, switch tab
    else if (event.target.closest('.tab')) {
      switchTab(event);
    }
  });
}

/**
 * Create a new tab both in memory and in the DB.
 */
function addTab() {
  const newTabName = `Tab ${Date.now()}`; // Unique name based on timestamp
  // Initialize empty data in memory
  games[newTabName] = { resources: [], jobs: [] };
  // Save to IndexedDB
  saveGameData(newTabName, games[newTabName]);

  // Update the 'tabs' list in IndexedDB
  const allTabNames = Object.keys(games);
  saveTabs(allTabNames);

  // Create the tab element in the DOM
  createTabElement(newTabName);

  // Automatically switch to the new tab
  activateTab(newTabName);
  updateResourceList();
  updateJobList();
}

/**
 * Creates the actual <div class="tab"> element for a given tab name
 * and inserts it before the "+ (add-tab)" button.
 */
function createTabElement(tabName) {
  const newTab = document.createElement('div');
  newTab.className = 'tab';
  newTab.dataset.tab = tabName;
  newTab.innerHTML = `<span>${tabName}</span><button class='edit-tab'>✎</button>`;
  const addTabBtn = document.querySelector('.add-tab');
  document.querySelector('.tabs').insertBefore(newTab, addTabBtn);
}

/**
 * Switches the active tab based on user click in the DOM.
 */
function switchTab(event) {
  const clickedTab = event.target.closest('.tab');
  if (!clickedTab) return;

  // Remove "active" from all tabs
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));

  // Add "active" to the clicked tab
  clickedTab.classList.add('active');
  activeTab = clickedTab.dataset.tab;

  // Load the data for that tab from IndexedDB
  loadGameData(activeTab, (data) => {
    games[activeTab] = data;
    updateResourceList();
    updateJobList();
  });
}

/**
 * Programmatically mark a tab as active by name.
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
 * Start the renaming process by replacing the <span> with an <input>,
 * and switching the edit button to a save icon.
 */
function renameTab(event, oldName) {
  event.stopPropagation();

  const tabElement = event.target.closest('.tab');
  const spanElement = tabElement.querySelector('span');
  const editButton = event.target;

  // Create an input with the old name
  const inputElement = document.createElement('input');
  inputElement.type = 'text';
  inputElement.value = oldName;
  inputElement.className = 'tab-input';

  // Replace the span with this input
  spanElement.replaceWith(inputElement);

  // Change button icon to a "save" icon
  editButton.textContent = '💾';

  // Focus the input for convenience
  inputElement.focus();
}

/**
 * Finish the renaming process. We do:
 * 1) Put (save) old data under new name in IndexedDB,
 * 2) Delete the old name record,
 * 3) Update memory & UI, so the data is not lost.
 */
function saveTabName(event, oldName) {
  event.stopPropagation();

  const tabElement = event.target.closest('.tab');
  const inputElement = tabElement.querySelector('.tab-input');
  const editButton = event.target;
  const newName = inputElement.value.trim();

  // If empty or unchanged, just revert
  if (!newName || newName === oldName) {
    revertRename(tabElement, oldName);
    return;
  }

  // Get the old data from memory (so we don't lose it)
  const oldData = games[oldName] || { resources: [], jobs: [] };

  // Open a transaction on "games" store
  const transaction = db.transaction(['games'], 'readwrite');
  const store = transaction.objectStore('games');

  // First, put (write) the same data under the new name
  const putRequest = store.put({ name: newName, ...oldData });
  putRequest.onsuccess = () => {
    // Next, delete the old record
    const delRequest = store.delete(oldName);
    delRequest.onsuccess = () => {
      // Once the delete is successful, update in-memory references
      games[newName] = oldData;
      delete games[oldName];

      // Update tab's dataset
      tabElement.dataset.tab = newName;

      // Swap input back to a span
      const spanElement = document.createElement('span');
      spanElement.textContent = newName;
      inputElement.replaceWith(spanElement);

      // Restore the button to pencil icon
      editButton.textContent = '✎';

      // Update our activeTab to the new name
      activeTab = newName;

      // Persist updated tab list
      saveTabs(Object.keys(games));

      // Finally, refresh the UI with the data under the new name
      updateResourceList();
      updateJobList();
    };

    delRequest.onerror = (err) => {
      console.error('Failed to delete old tab name from DB:', err);
    };
  };

  putRequest.onerror = (err) => {
    console.error('Failed to put new tab name into DB:', err);
  };
}

/**
 * Revert rename if user cancels or leaves name blank/unchanged.
 */
function revertRename(tabElement, oldName) {
  const inputElement = tabElement.querySelector('.tab-input');
  const editButton = tabElement.querySelector('.edit-tab');

  const spanElement = document.createElement('span');
  spanElement.textContent = oldName;
  inputElement.replaceWith(spanElement);

  // Restore the button to a pencil icon
  editButton.textContent = '✎';
}
