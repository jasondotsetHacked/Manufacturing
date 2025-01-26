const dbRequest = indexedDB.open('GameManufacturingDB', 1);
let db;

dbRequest.onupgradeneeded = (event) => {
    db = event.target.result;
    db.createObjectStore('games', { keyPath: 'name' });
};

dbRequest.onsuccess = (event) => {
    db = event.target.result;
    loadGameData('default');
    loadTabs();
};

dbRequest.onerror = (event) => {
    console.error('IndexedDB error:', event.target.error);
};

const games = { default: { resources: [], jobs: [] } };
let activeTab = 'default';

function renameTab(event, tabName) {
    const tabElement = event.target.closest('.tab');
    const spanElement = tabElement.querySelector('span');
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.value = tabName;
    inputElement.className = 'tab-input';

    spanElement.replaceWith(inputElement);
    event.target.textContent = '💾';
    event.target.onclick = (e) => saveTabName(e, tabName);
}

function saveTabName(event, oldName) {
    const tabElement = event.target.closest('.tab');
    const inputElement = tabElement.querySelector('.tab-input');
    const newName = inputElement.value.trim();

    if (newName) {
        const transaction = db.transaction(['games'], 'readwrite');
        const store = transaction.objectStore('games');
        store.delete(oldName);
        store.add({ name: newName, ...games[oldName] });
        delete games[oldName];
        games[newName] = { resources: [], jobs: [] };
        tabElement.dataset.tab = newName;
        activeTab = newName;

        const spanElement = document.createElement('span');
        spanElement.textContent = newName;
        inputElement.replaceWith(spanElement);
        event.target.textContent = '✎';
        event.target.onclick = (e) => renameTab(e, newName);

        saveTabs();
    }
}

function saveTabs() {
    const transaction = db.transaction(['games'], 'readwrite');
    const store = transaction.objectStore('games');
    const tabs = Object.keys(games);
    store.put({ name: 'tabs', tabs: tabs });
}

function loadTabs() {
    if (!db) {
        console.error('Database is not initialized');
        return;
    }
    const transaction = db.transaction(['games'], 'readonly');
    const store = transaction.objectStore('games');
    const request = store.get('tabs');

    request.onsuccess = () => {
        const data = request.result;
        if (data && data.tabs) {
            data.tabs.forEach((tabName) => {
                if (tabName !== 'default') {
                    const newTab = document.createElement('button');
                    newTab.className = 'tab';
                    newTab.dataset.tab = tabName;
                    newTab.innerHTML = `<span>${tabName}</span><button class='edit-tab' onclick='renameTab(event, "${tabName}")'>✎</button>`;
                    newTab.style.flex = '1';
                    document.querySelector('.tabs').insertBefore(newTab, document.querySelector('.add-tab'));
                    games[tabName] = { resources: [], jobs: [] };
                }
            });
        }
    };
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
        saveGameData();
        document.getElementById('resource-name').value = '';
    }
}

function updateResourceList() {
    const resourceList = document.querySelector('.resource-list');
    resourceList.innerHTML = '';
    games[activeTab].resources.forEach((resource) => {
        const li = document.createElement('li');
        li.textContent = `${resource.name} (${resource.type})`;
        li.className = 'resource-item';
        resourceList.appendChild(li);
    });
}

function addJob() {
    const jobName = document.getElementById('job-name').value;
    if (jobName) {
        games[activeTab].jobs.push({ name: jobName });
        updateJobList();
        saveGameData();
        document.getElementById('job-name').value = '';
    }
}

function updateJobList() {
    const jobList = document.querySelector('.job-list');
    jobList.innerHTML = '';
    games[activeTab].jobs.forEach((job) => {
        const li = document.createElement('li');
        li.textContent = job.name;
        li.className = 'job-item';
        jobList.appendChild(li);
    });
}

function saveGameData() {
    const transaction = db.transaction(['games'], 'readwrite');
    const store = transaction.objectStore('games');
    store.put({ name: activeTab, ...games[activeTab] });
}

function loadGameData(tabName) {
    const transaction = db.transaction(['games'], 'readonly');
    const store = transaction.objectStore('games');
    const request = store.get(tabName);

    request.onsuccess = () => {
        const data = request.result || { resources: [], jobs: [] };
        games[tabName] = data;
        updateResourceList();
        updateJobList();
    };
}

function toggleResourceInputs() {
    const resourceTypeCheckbox = document.getElementById('resource-type');
    const inputContainer = document.getElementById('resource-input-container');
    const resourceNameLabel = document.querySelector('label[for="resource-name"]');
    const resourceNameInput = document.getElementById('resource-name');
    const addResourceButton = document.querySelector('button[onclick="addResource()"]');

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

document.getElementById('add-input').addEventListener('click', () => {
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
});

document.getElementById('resource-input-container').addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-input')) {
        event.target.parentElement.remove();
    }
});

document.querySelector('.add-tab').addEventListener('click', () => {
    const newTabName = `Tab ${document.querySelectorAll('.tab').length}`;
    const newTab = document.createElement('div');
    newTab.className = 'tab';
    newTab.dataset.tab = newTabName;
    newTab.innerHTML = `<span>${newTabName}</span><button class='edit-tab' onclick='renameTab(event, "${newTabName}")'>✎</button>`;

    document.querySelector('.tabs').insertBefore(newTab, document.querySelector('.add-tab'));

    games[newTabName] = { resources: [], jobs: [] };
    saveGameData();
    saveTabs();
});

document.querySelector('.tabs').addEventListener('click', (event) => {
    if (event.target.closest('.tab')) {
        document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
        const tabElement = event.target.closest('.tab');
        tabElement.classList.add('active');
        activeTab = tabElement.dataset.tab;
        loadGameData(activeTab);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    toggleResourceInputs();
    const defaultTab = document.querySelector('.tab[data-tab="default"]');
    defaultTab.innerHTML = `<span>Default</span><button class='edit-tab' onclick='renameTab(event, "default")'>✎</button>`;
    defaultTab.querySelector('.edit-tab').onclick = (e) => renameTab(e, 'default');
    defaultTab.style.flex = '1';
});
