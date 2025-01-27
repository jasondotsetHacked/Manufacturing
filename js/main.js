import { initDB } from './db.js';
import { initResources } from './resources.js';
import { initJobs } from './jobs.js';

document.addEventListener('DOMContentLoaded', () => {
    initDB();
    initResources();
    initJobs();
});
