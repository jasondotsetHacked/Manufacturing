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
}

function addResource() {
    const resourceName = document.getElementById('resource-name').value;
    const resourceType = document.getElementById('resource-type').checked;
    let resource;

    if (resourceType) {
        resource = { name: resourceName, type: 'Product', inputs: [] };
    } else {
        const inputs = [];
        document.querySelectorAll('.input-group').forEach((group) => {
            const inputResource = group.querySelector('.resource-input').value;
            const quantity = group.querySelector('.resource-quantity').value;
            inputs.push({ input: inputResource, quantity: parseInt(quantity) });
        });
        resource = { name: resourceName, type: 'Resource', inputs: inputs };
    }

    if (resourceName) {
        games[activeTab].resources.push(resource);
        updateResourceList();
        saveGameData(activeTab, games[activeTab]);
        document.getElementById('resource-name').value = '';
    }
}

export function updateResourceList() {
    const resourceList = document.querySelector('.resource-list');
    resourceList.innerHTML = '';
    games[activeTab].resources.forEach((resource) => {
        const li = document.createElement('li');
        li.textContent = `${resource.name} (${resource.type})`;
        li.className = 'resource-item';
        resourceList.appendChild(li);
    });
}

function toggleResourceInputs() {
    const resourceTypeCheckbox = document.getElementById('resource-type');
    const inputContainer = document.getElementById('resource-input-container');
    const resourceNameLabel = document.querySelector('label[for="resource-name"]');
    const resourceNameInput = document.getElementById('resource-name');
    const addResourceButton = document.getElementById('add-resource-btn');

    if (resourceTypeCheckbox.checked) {
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
    inputSelects.forEach((inputSelect) => {
        inputSelect.innerHTML = '';
        games[activeTab].resources.forEach((res) => {
            const option = document.createElement('option');
            option.value = res.name;
            option.textContent = res.name;
            inputSelect.appendChild(option);
        });
    });
}

function addInput() {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.innerHTML = `
        <select class="resource-input"></select>
        <input type="number" class="resource-quantity" min="1" placeholder="Quantity">
        <button type="button" class="remove-input">Remove</button>
    `;
    const inputContainer = document.getElementById('resource-input-container');
    inputContainer.insertBefore(inputGroup, document.getElementById('add-input'));
    updateInputOptions();
}
