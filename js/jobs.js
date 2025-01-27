import { activeTab, games } from './tabs.js';
import { saveGameData } from './db.js';
import { updateShoppingList } from './resources.js';

export function initJobs() {
  document.getElementById('add-job-btn').addEventListener('click', addJob);
  document
    .getElementById('add-job-input')
    .addEventListener('click', addJobProductInput);

  document.querySelector('.job-list').addEventListener('click', (e) => {
    const li = e.target.closest('.job-item');
    if (!li) return;

    if (e.target.classList.contains('remove-job')) {
      removeJob(li.dataset.jobName);
      return;
    }

    if (e.target.classList.contains('job-name-span')) {
      const jobName = li.dataset.jobName;
      showJobResourceTotals(jobName);
    }
  });

  updateJobList();
  updateJobProductDropdown();
}

function addJob() {
  if (!games[activeTab]) {
    games[activeTab] = { resources: [], jobs: [] };
  }
  
  const jobName = document.getElementById('job-name').value.trim();
  if (!jobName) return;

  const productItems = [];
  document.querySelectorAll('#job-input-container .input-group').forEach((group) => {
    const productName = group.querySelector('.job-product-input').value;
    const quantity = parseInt(group.querySelector('.job-product-quantity').value) || 0;
    if (productName && quantity > 0) {
      productItems.push({ productName, quantity });
    }
  });

  games[activeTab].jobs.push({
    name: jobName,
    products: productItems,
  });

  saveGameData(activeTab, games[activeTab]);
  updateJobList();

  document.getElementById('job-name').value = '';
  resetJobProductInputs();
}

export function updateJobList() {
  const jobList = document.querySelector('.job-list');
  jobList.innerHTML = '';

  games[activeTab].jobs.forEach((job) => {
    const li = document.createElement('li');
    li.className = 'job-item';
    li.dataset.jobName = job.name;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = job.name;
    nameSpan.classList.add('job-name-span');

    li.appendChild(nameSpan);

    jobList.appendChild(li);
  });
}

function addJobProductInput() {
  const container = document.getElementById('job-input-container');
  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';
  inputGroup.innerHTML = `
    <select class="job-product-input"></select>
    <input type="number" class="job-product-quantity" min="1" placeholder="Quantity" />
    <button type="button" class="remove-job-input">Remove</button>
  `;
  container.insertBefore(inputGroup, document.getElementById('add-job-input'));

  updateJobProductDropdown();
}

function removeJob(jobName) {
  const idx = games[activeTab].jobs.findIndex((j) => j.name === jobName);
  if (idx !== -1) {
    games[activeTab].jobs.splice(idx, 1);
    saveGameData(activeTab, games[activeTab]);
    updateJobList();
  }
}

function resetJobProductInputs() {
  const container = document.getElementById('job-input-container');
  const groups = container.querySelectorAll('.input-group');
  groups.forEach((group, index) => {
    if (index === 0) {
      group.querySelector('.job-product-input').selectedIndex = 0;
      group.querySelector('.job-product-quantity').value = '';
    } else {
      group.remove();
    }
  });
}

export function updateJobProductDropdown() {
  const selects = document.querySelectorAll('.job-product-input');
  selects.forEach((select) => {
    select.innerHTML = '';
    const productList = games[activeTab].resources.filter(
      (r) => r.type === 'Product'
    );
    productList.forEach((p) => {
      const option = document.createElement('option');
      option.value = p.name;
      option.textContent = p.name;
      select.appendChild(option);
    });
  });
}

function showJobResourceTotals(jobName) {
  const job = games[activeTab].jobs.find((j) => j.name === jobName);
  if (!job) return;

  const grandTotals = {};

  job.products.forEach((p) => {
    const productTotals = calculateResourceTotals(p.productName);
    Object.entries(productTotals).forEach(([resName, qty]) => {
      grandTotals[resName] = (grandTotals[resName] || 0) + qty * p.quantity;
    });
  });

  const shoppingItems = Object.entries(grandTotals).map(
    ([resName, qty]) => `${resName}: ${qty}`
  );
  updateShoppingList(shoppingItems);
}

function calculateResourceTotals(productName) {
  const product = games[activeTab].resources.find(
    (r) => r.name === productName && r.type === 'Product'
  );
  if (!product) return {};
  const totals = {};
  product.inputs.forEach((input) => {
    const resName = input.input;
    totals[resName] = (totals[resName] || 0) + input.quantity;
  });
  return totals;
}