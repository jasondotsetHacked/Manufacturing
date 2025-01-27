import { initDB } from './db.js';
import { initTabs } from './tabs.js';
import { initResources } from './resources.js';

document.addEventListener('DOMContentLoaded', () => {
  initDB()
    .then(() => {
      initTabs();
      initResources();
    })
    .catch((err) => {
      console.error('Failed to initialize IndexedDB:', err);
    });
});