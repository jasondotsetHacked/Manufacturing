import { activeTab, games } from './tabs.js';
import { saveGameData } from './db.js';

export function initJobs() {
  document.getElementById('add-job-btn').addEventListener('click', addJob);
}

function addJob() {
  const jobName = document.getElementById('job-name').value.trim();
  if (!jobName) return;
  games[activeTab].jobs.push({ name: jobName });
  saveGameData(activeTab, games[activeTab]);
  updateJobList();
  document.getElementById('job-name').value = '';
}

export function updateJobList() {
  const jobList = document.querySelector('.job-list');
  jobList.innerHTML = '';
  games[activeTab].jobs.forEach((job) => {
    const li = document.createElement('li');
    li.textContent = job.name;
    li.className = 'job-item';
    jobList.appendChild(li);
  });
}
