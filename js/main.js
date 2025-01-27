import { initDB } from './db.js';
import { initTabs } from './tabs.js';
import { initResources } from './resources.js';
import { initJobs } from './jobs.js';

document.addEventListener('DOMContentLoaded', () => {
  // Ensure DB opens first
  initDB()
    .then(() => {
      // Now initialize everything else
      initTabs();
      initResources();
      initJobs();
    })
    .catch((err) => {
      console.error('Failed to initialize IndexedDB:', err);
    });
});