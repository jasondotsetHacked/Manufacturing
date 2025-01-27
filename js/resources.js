import { activeTab, games } from './tabs.js';
import { saveGameData } from './db.js';

export function initResources() {
  document.getElementById('add-resource-btn').addEventListener('click', addResource);
  document.getElementById('resource-type').addEventListener('change', toggleResourceInputs);
  document.getElementById('add-input').addEventListener('click', addInput);
  document.getElementById('resource-input-container').addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-input')) {
      event.target.parentElement.remove();
    }
  });
  document.querySelector('.resource-list').addEventListener('click', handleResourceListClick);
}

function addResource() {
  if (!games[activeTab]) {
    games[activeTab] = { resources: [] };
  }
  const resourceName = document.getElementById('resource-name').value.trim();
  const isProduct = document.getElementById('resource-type').checked;
  if (!resourceName) return;
  if (isProduct) {
    const inputs = [];
    document.querySelectorAll('#resource-input-container .input-group').forEach((group) => {
      const inputResource = group.querySelector('.resource-input').value;
      const quantity = parseInt(group.querySelector('.resource-quantity').value) || 1;
      inputs.push({ input: inputResource, quantity });
    });
    games[activeTab].resources.push({ name: resourceName, type: 'Product', inputs });
  } else {
    games[activeTab].resources.push({ name: resourceName, type: 'Resource', inputs: [] });
  }
  saveGameData(activeTab, games[activeTab]);
  updateResourceList();
  document.getElementById('resource-name').value = '';
}

export function updateResourceList() {
  const resourceList = document.querySelector('.resource-list');
  resourceList.innerHTML = '';
  if (!activeTab || !games[activeTab] || !games[activeTab].resources) {
    return;
  }
  games[activeTab].resources.forEach((res) => {
    const li = document.createElement('li');
    li.className = 'resource-item';
    li.dataset.resName = res.name;
    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${res.name} (${res.type})`;
    nameSpan.classList.add('resource-name-span');
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-resource');
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.classList.add('remove-resource');
    li.appendChild(nameSpan);
    li.appendChild(editBtn);
    li.appendChild(removeBtn);
    resourceList.appendChild(li);
  });
}

function toggleResourceInputs() {
  const inputContainer = document.getElementById('resource-input-container');
  const isProduct = document.getElementById('resource-type').checked;
  const resourceNameLabel = document.querySelector('label[for="resource-name"]');
  const resourceNameInput = document.getElementById('resource-name');
  const addResourceButton = document.getElementById('add-resource-btn');
  if (isProduct) {
    inputContainer.style.display = 'block';
    resourceNameLabel.textContent = 'Product Name';
    resourceNameInput.placeholder = 'e.g., T2 Product';
    addResourceButton.textContent = 'Add Product';
    updateInputOptions();
  } else {
    inputContainer.style.display = 'none';
    resourceNameLabel.textContent = 'Resource Name';
    resourceNameInput.placeholder = 'e.g., T1 Resource';
    addResourceButton.textContent = 'Add Resource';
  }
}

function updateInputOptions() {
  const inputSelects = document.querySelectorAll('.resource-input');
  inputSelects.forEach((select) => {
    select.innerHTML = '';
    games[activeTab].resources.forEach((res) => {
      const option = document.createElement('option');
      option.value = res.name;
      option.textContent = res.name;
      select.appendChild(option);
    });
  });
}

function addInput() {
  const inputGroup = document.createElement('div');
  inputGroup.className = 'input-group';
  inputGroup.innerHTML = `
    <select class="resource-input"></select>
    <input type="number" class="resource-quantity" min="1" placeholder="Quantity" />
    <button type="button" class="remove-input">Remove</button>
  `;
  const inputContainer = document.getElementById('resource-input-container');
  inputContainer.insertBefore(inputGroup, document.getElementById('add-input'));
  updateInputOptions();
}

function handleResourceListClick(event) {
  const li = event.target.closest('.resource-item');
  if (!li) return;
  const resName = li.dataset.resName;
  const resourceObj = games[activeTab].resources.find((r) => r.name === resName);
  if (!resourceObj) return;
  if (event.target.classList.contains('edit-resource')) {
    editResource(resourceObj);
  } else if (event.target.classList.contains('remove-resource')) {
    removeResource(resourceObj);
  } else if (event.target.classList.contains('resource-name-span')) {
    if (resourceObj.type === 'Product') {
      const productTotals = calculateResourceTotals(resourceObj);
      const shoppingItems = Object.entries(productTotals).map(([name, qty]) => `${name}: ${qty}`);
      updateShoppingList(shoppingItems);
    } else {
      updateShoppingList([`${resourceObj.name} is a raw resource (no inputs).`]);
    }
  }
}

function editResource(resourceObj) {
  const idx = games[activeTab].resources.findIndex((r) => r.name === resourceObj.name);
  if (idx === -1) return;
  games[activeTab].resources.splice(idx, 1);
  document.getElementById('resource-name').value = resourceObj.name;
  const isProduct = resourceObj.type === 'Product';
  document.getElementById('resource-type').checked = isProduct;
  toggleResourceInputs();
  if (isProduct && resourceObj.inputs) {
    const container = document.getElementById('resource-input-container');
    const groups = container.querySelectorAll('.input-group');
    groups.forEach((g, i) => {
      if (i > 0) g.remove();
    });
    if (resourceObj.inputs.length > 0) {
      const firstGroup = container.querySelector('.input-group');
      resourceObj.inputs.forEach((inp, index) => {
        let groupEl;
        if (index === 0) {
          groupEl = firstGroup;
        } else {
          addInput();
          const allGroups = container.querySelectorAll('.input-group');
          groupEl = allGroups[allGroups.length - 1];
        }
        groupEl.querySelector('.resource-input').value = inp.input;
        groupEl.querySelector('.resource-quantity').value = inp.quantity;
      });
    }
  }
  saveGameData(activeTab, games[activeTab]);
  updateResourceList();
}

function removeResource(resourceObj) {
  const idx = games[activeTab].resources.findIndex((r) => r.name === resourceObj.name);
  if (idx === -1) return;
  games[activeTab].resources.splice(idx, 1);
  saveGameData(activeTab, games[activeTab]);
  updateResourceList();
  updateShoppingList([]);
}

function calculateResourceTotals(product) {
  if (!product || product.type !== 'Product' || !product.inputs) {
    return {};
  }
  const totals = {};
  product.inputs.forEach((inp) => {
    totals[inp.input] = (totals[inp.input] || 0) + inp.quantity;
  });
  return totals;
}

export function updateShoppingList(items) {
  const list = document.querySelector('.shopping-list');
  list.innerHTML = '';
  items.forEach((text) => {
    const li = document.createElement('li');
    li.className = 'shopping-item';
    li.textContent = text;
    list.appendChild(li);
  });
}