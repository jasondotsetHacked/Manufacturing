export let db;

export function initDB() {
    const dbRequest = indexedDB.open('GameManufacturingDB', 1);

    dbRequest.onupgradeneeded = (event) => {
        db = event.target.result;
        db.createObjectStore('games', { keyPath: 'name' });
    };

    dbRequest.onsuccess = (event) => {
        db = event.target.result;
        // Ensure db is initialized before calling loadTabs
        if (typeof initTabs === 'function') {
            initTabs();
        }
    };

    dbRequest.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
    };
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
        callback(data ? data.tabs : []);
    };
}
