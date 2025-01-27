export let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('GameManufacturingDB', 1);

    dbRequest.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'name' });
      }
    };

    dbRequest.onsuccess = (event) => {
      db = event.target.result;
      resolve(); // Resolves once DB is ready
    };

    dbRequest.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

export function saveGameData(tabName, data) {
  const transaction = db.transaction(['games'], 'readwrite');
  const store = transaction.objectStore('games');
  store.put({ name: tabName, ...data });
}

export function loadGameData(tabName, callback) {
  const transaction = db.transaction(['games'], 'readonly');
  const store = transaction.objectStore('games');
  const request = store.get(tabName);

  request.onsuccess = () => {
    // Return an object with empty arrays if no existing data
    const data = request.result || { resources: [], jobs: [] };
    callback(data);
  };
}

export function saveTabs(tabs) {
  const transaction = db.transaction(['games'], 'readwrite');
  const store = transaction.objectStore('games');
  store.put({ name: 'tabs', tabs: tabs });
}

export function loadTabs(callback) {
  const transaction = db.transaction(['games'], 'readonly');
  const store = transaction.objectStore('games');
  const request = store.get('tabs');

  request.onsuccess = () => {
    const data = request.result;
    if (data && data.tabs) {
      callback(data.tabs);
    } else {
      callback([]);
    }
  };
}
