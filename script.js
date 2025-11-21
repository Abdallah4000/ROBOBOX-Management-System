// ==================== DATA MANAGEMENT ====================
const DB_KEY = 'inventoryDB';
let currentInputNameCallback = null;
let currentProductSelectionCallback = null;
let currentDeleteCallback = null;
let filterClientId = null;

class InventoryDB {
    constructor() {
        this.load();
    }

    load() {
        const data = localStorage.getItem(DB_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            this.products = parsed.products || [];
            this.clients = parsed.clients || [];
            this.projects = parsed.projects || [];
        } else {
            this.products = [];
            this.clients = [];
            this.projects = [];
        }
    }

    save() {
        localStorage.setItem(DB_KEY, JSON.stringify({
            products: this.products,
            clients: this.clients,
            projects: this.projects
        }));
    }

    addProduct(product) {
        product.id = Date.now();
        this.products.push(product);
        this.save();
        return product;
    }

    updateProduct(id, product) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...product };
            this.save();
        }
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.save();
    }

    getProduct(id) {
        return this.products.find(p => p.id === id);
    }

    addClient(client) {
        client.id = Date.now();
        this.clients.push(client);
        this.save();
        return client;
    }

    updateClient(id, client) {
        const index = this.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            this.clients[index] = { ...this.clients[index], ...client };
            this.save();
        }
    }

    deleteClient(id) {
        this.clients = this.clients.filter(c => c.id !== id);
        this.projects = this.projects.filter(p => p.clientId !== id);
        this.save();
    }

    getClient(id) {
        return this.clients.find(c => c.id === id);
    }

    addProject(project) {
        project.id = Date.now();
        project.structure = [];
        this.projects.push(project);
        this.save();
        return project;
    }

    updateProject(id, project) {
        const index = this.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.projects[index] = { ...this.projects[index], ...project };
            this.save();
        }
    }

    deleteProject(id) {
        this.projects = this.projects.filter(p => p.id !== id);
        this.save();
    }

    getProject(id) {
        return this.projects.find(p => p.id === id);
    }

    getClientProjects(clientId) {
        return this.projects.filter(p => p.clientId === clientId);
    }
}

const db = new InventoryDB();

// ==================== UTILITIES ====================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'products') renderProducts();
    if (tabName === 'clients') renderClients();
    if (tabName === 'projects') { filterClientId = null; renderProjects(); }
}

function previewImage() {
    const input = document.getElementById('productImage');
    const preview = document.getElementById('imagePreview');
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 6px;">`;
        };
        reader.readAsDataURL(file);
    }
}

// ==================== CONFIRMATION MODAL ====================
function openDeleteConfirmModal(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    currentDeleteCallback = callback;
    document.getElementById('confirmModal').classList.add('show');
}

function closeDeleteConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
    currentDeleteCallback = null;
}

function confirmDelete() {
    if (currentDeleteCallback) {
        currentDeleteCallback();
    }
    closeDeleteConfirmModal();
}

// ==================== CLIENT PROJECTS MODAL ====================
function openClientProjectsModal(clientId) {
    const client = db.getClient(clientId);
    const projects = db.getClientProjects(clientId);
    
    let html = `<h2>${client.name} - Projects</h2>`;
    
    if (projects.length === 0) {
        html += `<p style="color: #999; text-align: center; padding: 40px;">No projects for this client yet.</p>`;
    } else {
        html += `<table class="summary-table" style="margin-top: 20px;">
            <thead>
                <tr>
                    <th>Project Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>`;
        
        projects.forEach(project => {
            html += `<tr>
                <td><strong>${project.name}</strong></td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="openProjectDetails(${project.id})">View Details</button>
                    <button class="btn btn-info btn-sm" onclick="openSummaryModal(${project.id})">📊 Summary</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProjectConfirm(${project.id})">Delete</button>
                </td>
            </tr>`;
        });
        
        html += `</tbody>
        </table>`;
    }
    
    document.getElementById('clientProjectsContent').innerHTML = html;
    document.getElementById('clientProjectsModal').classList.add('show');
}

function closeClientProjectsModal() {
    document.getElementById('clientProjectsModal').classList.remove('show');
}

// ==================== PRODUCTS ====================
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    if (productId) {
        const product = db.getProduct(productId);
        document.getElementById('productName').value = product.name;
        document.getElementById('productType').value = product.type || '';
        document.getElementById('productCompany').value = product.company || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productComment').value = product.comment || '';
        if (product.imageBase64) {
            document.getElementById('imagePreview').innerHTML = `<img src="${product.imageBase64}" style="max-width: 200px; max-height: 200px; border-radius: 6px;">`;
        }
        modal.dataset.productId = productId;
        document.querySelector('.modal-header-fullscreen h2').textContent = 'Edit Product';
    } else {
        document.getElementById('productName').value = '';
        document.getElementById('productType').value = '';
        document.getElementById('productCompany').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productComment').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        delete modal.dataset.productId;
        document.querySelector('.modal-header-fullscreen h2').textContent = 'Add Product';
    }
    modal.classList.add('show');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
}

function saveProduct(e) {
    e.preventDefault();
    const modal = document.getElementById('productModal');
    const productId = modal.dataset.productId;
    
    const imageFile = document.getElementById('productImage').files[0];
    let imageBase64 = '';

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = () => {
            imageBase64 = reader.result;
            saveProductData(productId, imageBase64);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveProductData(productId, '');
    }

    function saveProductData(id, image) {
        const product = {
            name: document.getElementById('productName').value,
            type: document.getElementById('productType').value,
            company: document.getElementById('productCompany').value,
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            comment: document.getElementById('productComment').value,
            imageBase64: image || (id ? db.getProduct(parseInt(id)).imageBase64 : '')
        };

        if (id) {
            db.updateProduct(parseInt(id), product);
            showNotification('Product updated successfully!');
        } else {
            db.addProduct(product);
            showNotification('Product added successfully!');
        }

        closeProductModal();
        renderProducts();
    }
}

function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    const empty = document.getElementById('productsEmpty');
    
    if (db.products.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = db.products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.type || '-'}</td>
            <td>${product.company || '-'}</td>
            <td>${product.price ? '$' + product.price.toFixed(2) : '-'}</td>
            <td>${product.imageBase64 ? `<img src="${product.imageBase64}" class="product-img">` : '-'}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openProductModal(${product.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProductConfirm(${product.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteProductConfirm(productId) {
    openDeleteConfirmModal('Are you sure you want to delete this product?', () => {
        db.deleteProduct(productId);
        showNotification('Product deleted!', 'warning');
        renderProducts();
    });
}

function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ==================== CLIENTS ====================
function openClientModal(clientId = null) {
    const modal = document.getElementById('clientModal');
    if (clientId) {
        const client = db.getClient(clientId);
        document.getElementById('clientName').value = client.name;
        document.getElementById('clientAddress').value = client.address || '';
        document.getElementById('clientPhone').value = client.phone || '';
        modal.dataset.clientId = clientId;
        document.querySelector('#clientModal .modal-header-fullscreen h2').textContent = 'Edit Client';
    } else {
        document.getElementById('clientName').value = '';
        document.getElementById('clientAddress').value = '';
        document.getElementById('clientPhone').value = '';
        delete modal.dataset.clientId;
        document.querySelector('#clientModal .modal-header-fullscreen h2').textContent = 'Add Client';
    }
    modal.classList.add('show');
}

function closeClientModal() {
    document.getElementById('clientModal').classList.remove('show');
}

function saveClient(e) {
    e.preventDefault();
    const modal = document.getElementById('clientModal');
    const clientId = modal.dataset.clientId;

    const client = {
        name: document.getElementById('clientName').value,
        address: document.getElementById('clientAddress').value,
        phone: document.getElementById('clientPhone').value
    };

    if (clientId) {
        db.updateClient(parseInt(clientId), client);
        showNotification('Client updated successfully!');
    } else {
        db.addClient(client);
        showNotification('Client added successfully!');
    }

    closeClientModal();
    renderClients();
    updateProjectClientDropdown();
}

function renderClients() {
    const clientsList = document.getElementById('clientsList');
    
    if (db.clients.length === 0) {
        clientsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>No clients yet. Add one to get started!</p>
            </div>
        `;
        return;
    }

    clientsList.innerHTML = db.clients.map(client => `
        <div class="card">
            <div class="card-header">
                <div>
                    <div class="card-title">${client.name}</div>
                    <div style="font-size: 0.9em; color: #666;">
                        ${client.phone ? '📞 ' + client.phone : ''}
                        ${client.address ? '<br>📍 ' + client.address : ''}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="openClientModal(${client.id})">Edit</button>
                    <button class="btn btn-success btn-sm" onclick="openClientProjectsModal(${client.id})">Projects</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteClientConfirm(${client.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function deleteClientConfirm(clientId) {
    openDeleteConfirmModal('Are you sure? This will delete the client and all their projects!', () => {
        db.deleteClient(clientId);
        showNotification('Client deleted!', 'warning');
        renderClients();
        renderProjects();
    });
}

// ==================== PROJECTS ====================
function openProjectModal(projectId = null) {
    const modal = document.getElementById('projectModal');
    updateProjectClientDropdown();
    
    if (projectId) {
        const project = db.getProject(projectId);
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectClient').value = project.clientId;
        modal.dataset.projectId = projectId;
        document.querySelector('#projectModal .modal-header-fullscreen h2').textContent = 'Edit Project';
    } else {
        document.getElementById('projectName').value = '';
        document.getElementById('projectClient').value = '';
        delete modal.dataset.projectId;
        document.querySelector('#projectModal .modal-header-fullscreen h2').textContent = 'New Project';
    }
    modal.classList.add('show');
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('show');
}

function updateProjectClientDropdown() {
    const select = document.getElementById('projectClient');
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Select a Client --</option>';
    select.innerHTML += db.clients.map(client => 
        `<option value="${client.id}">${client.name}</option>`
    ).join('');
    if (currentValue) select.value = currentValue;
}

function saveProject(e) {
    e.preventDefault();
    const modal = document.getElementById('projectModal');
    const projectId = modal.dataset.projectId;

    const project = {
        name: document.getElementById('projectName').value,
        clientId: parseInt(document.getElementById('projectClient').value)
    };

    if (projectId) {
        db.updateProject(parseInt(projectId), project);
        showNotification('Project updated successfully!');
    } else {
        db.addProject(project);
        showNotification('Project created successfully!');
    }

    closeProjectModal();
    renderProjects();
}

function renderProjects() {
    const tbody = document.getElementById('projectsTableBody');
    const empty = document.getElementById('projectsEmpty');
    
    if (db.projects.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = db.projects.map(project => {
        const client = db.getClient(project.clientId);
        return `
            <tr>
                <td>${project.name}</td>
                <td>${client ? client.name : 'N/A'}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="openProjectDetails(${project.id})">View Details</button>
                    <button class="btn btn-info btn-sm" onclick="openSummaryModal(${project.id})">📊 Summary</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProjectConfirm(${project.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function deleteProjectConfirm(projectId) {
    openDeleteConfirmModal('Are you sure you want to delete this project?', () => {
        db.deleteProject(projectId);
        showNotification('Project deleted!', 'warning');
        renderProjects();
    });
}

// ==================== INPUT NAME MODAL ====================
function openInputNameModal(label, callback) {
    document.getElementById('inputNameLabel').textContent = label;
    document.getElementById('inputNameValue').value = '';
    currentInputNameCallback = callback;
    document.getElementById('inputNameModal').classList.add('show');
}

function closeInputNameModal() {
    document.getElementById('inputNameModal').classList.remove('show');
    currentInputNameCallback = null;
}

function confirmInputName(e) {
    e.preventDefault();
    const value = document.getElementById('inputNameValue').value.trim();
    if (value && currentInputNameCallback) {
        currentInputNameCallback(value);
    }
    closeInputNameModal();
}

// ==================== PRODUCT SELECTION MODAL ====================
function openProductSelectionModal(callback) {
    currentProductSelectionCallback = callback;
    renderProductSelection();
    document.getElementById('productSelectionModal').classList.add('show');
}

function closeProductSelectionModal() {
    document.getElementById('productSelectionModal').classList.remove('show');
    currentProductSelectionCallback = null;
}

function renderProductSelection() {
    const container = document.getElementById('productList');
    if (db.products.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No products available</div>';
        return;
    }

    container.innerHTML = db.products.map(product => `
        <div class="product-item" onclick="selectProductForProject(${product.id})">
            <div class="product-item-info">
                <div class="product-item-name">${product.name}</div>
                <div class="product-item-details">
                    ${product.company ? product.company + ' • ' : ''}${product.type || 'N/A'}
                </div>
            </div>
            <div class="product-item-price">$${(product.price || 0).toFixed(2)}</div>
        </div>
    `).join('');
}

function selectProductForProject(productId) {
    const product = db.getProduct(productId);
    if (currentProductSelectionCallback) {
        currentProductSelectionCallback(product);
    }
    closeProductSelectionModal();
}

function filterProductSelection() {
    const searchTerm = document.getElementById('productSelectSearch').value.toLowerCase();
    const items = document.querySelectorAll('.product-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ==================== PROJECT DETAILS ====================
function openProjectDetails(projectId) {
    const project = db.getProject(projectId);
    const client = db.getClient(project.clientId);
    
    let html = `
        <div class="project-details-header">
            <div>
                <h2>${project.name}</h2>
                <p style="color: #666; margin-top: 5px;">Client: <strong>${client.name}</strong></p>
            </div>
            <button type="button" class="btn btn-secondary" onclick="closeProjectDetailsModal()">✕ Close</button>
        </div>

        <div class="project-action-buttons">
            <button class="btn btn-primary" onclick="openAddLevelMenu(${projectId})">+ Add Level</button>
            <button class="btn btn-primary" onclick="openAddAreaMenu(${projectId})">+ Add Area</button>
            <button class="btn btn-primary" onclick="openAddProductMenu(${projectId})">+ Add Product</button>
        </div>

        <div class="hierarchy-container" id="hierarchyContainer_${projectId}"></div>
    `;
    
    document.getElementById('projectDetailsContent').innerHTML = html;
    renderProjectHierarchy(projectId);
    document.getElementById('projectDetailsModal').classList.add('show');
}

function closeProjectDetailsModal() {
    document.getElementById('projectDetailsModal').classList.remove('show');
}

function openAddLevelMenu(projectId) {
    openInputNameModal('Enter Level Name', (name) => {
        addLevel(projectId, name);
    });
}

function openAddAreaMenu(projectId) {
    openInputNameModal('Enter Area Name', (name) => {
        addArea(projectId, name);
    });
}

function openAddProductMenu(projectId) {
    openProductSelectionModal((product) => {
        addProduct(projectId, product);
    });
}

function addLevel(projectId, name) {
    const project = db.getProject(projectId);
    project.structure.push({
        id: Date.now(),
        type: 'level',
        name: name,
        children: []
    });
    db.updateProject(projectId, project);
    renderProjectHierarchy(projectId);
    showNotification('Level added!');
}

function addArea(projectId, name, parentId = null) {
    const project = db.getProject(projectId);
    const item = {
        id: Date.now(),
        type: 'area',
        name: name,
        children: []
    };
    
    if (parentId) {
        const parent = findItemInStructure(project.structure, parentId);
        if (parent) parent.children.push(item);
    } else {
        project.structure.push(item);
    }
    db.updateProject(projectId, project);
    renderProjectHierarchy(projectId);
    showNotification('Area added!');
}

function addProduct(projectId, product, parentId = null) {
    const quantity = 1;
    const project = db.getProject(projectId);
    const item = {
        id: Date.now(),
        type: 'product',
        productId: product.id,
        quantity: quantity
    };
    
    if (parentId) {
        const parent = findItemInStructure(project.structure, parentId);
        if (parent) parent.children.push(item);
    } else {
        project.structure.push(item);
    }
    db.updateProject(projectId, project);
    renderProjectHierarchy(projectId);
    showNotification('Product added!');
}

function findItemInStructure(structure, itemId) {
    for (let item of structure) {
        if (item.id === itemId) return item;
        if (item.children) {
            const found = findItemInStructure(item.children, itemId);
            if (found) return found;
        }
    }
    return null;
}

function renderProjectHierarchy(projectId) {
    const project = db.getProject(projectId);
    const container = document.getElementById(`hierarchyContainer_${projectId}`);
    
    let html = '';
    project.structure.forEach(item => {
        html += renderHierarchyItem(item, projectId, 0);
    });
    
    container.innerHTML = html || '<p style="color: #999; text-align: center; padding: 40px;">No items yet. Click buttons above to add!</p>';
}

function renderHierarchyItem(item, projectId, level) {
    const indent = level * 30;
    let html = `<div style="margin-left: ${indent}px; margin-bottom: 10px; padding: 15px; background: #f9f9f9; border-left: 4px solid #667eea; border-radius: 4px;">`;
    
    if (item.type === 'level') {
        html += `<div style="display: flex; justify-content: space-between; align-items: center;">`;
        html += `<strong style="font-size: 1.1em; color: #667eea;">📌 ${item.name}</strong>`;
        html += `<div style="display: flex; gap: 8px;">`;
        html += ` <button class="btn btn-success btn-sm" onclick="openAddAreaToLevel(${projectId}, ${item.id})">+ Area</button>`;
        html += ` <button class="btn btn-success btn-sm" onclick="openAddProductToLevel(${projectId}, ${item.id})">+ Product</button>`;
        html += ` <button class="btn btn-danger btn-sm" onclick="deleteItemConfirm(${projectId}, ${item.id}, 'level')">Delete</button>`;
        html += `</div></div>`;
    } else if (item.type === 'area') {
        html += `<div style="display: flex; justify-content: space-between; align-items: center;">`;
        html += `<strong style="font-size: 1em; color: #ff9500;">🛋️ ${item.name}</strong>`;
        html += `<div style="display: flex; gap: 8px;">`;
        html += ` <button class="btn btn-success btn-sm" onclick="openAddProductToArea(${projectId}, ${item.id})">+ Product</button>`;
        html += ` <button class="btn btn-danger btn-sm" onclick="deleteItemConfirm(${projectId}, ${item.id}, 'area')">Delete</button>`;
        html += `</div></div>`;
    } else if (item.type === 'product') {
        const product = db.getProduct(item.productId);
        html += `<div style="display: flex; justify-content: space-between; align-items: center;">`;
        html += `<div>`;
        html += `<strong style="color: #42a5f5;">🔌 ${product.name}</strong><br>`;
        html += `<span style="font-size: 0.9em; color: #666;">${product.company || 'N/A'} • ${product.type || 'N/A'}</span>`;
        if (product.comment) {
            html += `<br><span style="font-size: 0.85em; color: #999; font-style: italic;">💬 ${product.comment}</span>`;
        }
        html += `</div>`;
        html += `<div style="display: flex; align-items: center; gap: 8px;">`;
        html += `<span>Qty:</span><input type="number" value="${item.quantity}" style="width: 60px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;" onchange="updateQuantity(${projectId}, ${item.id}, this.value)">`;
        html += ` <button class="btn btn-danger btn-sm" onclick="deleteItemConfirm(${projectId}, ${item.id}, 'product')">Delete</button>`;
        html += `</div></div>`;
    }
    
    html += `</div>`;
    
    if (item.children && item.children.length > 0) {
        item.children.forEach(child => {
            html += renderHierarchyItem(child, projectId, level + 1);
        });
    }
    
    return html;
}

function openAddAreaToLevel(projectId, levelId) {
    openInputNameModal('Enter Area Name', (name) => {
        addArea(projectId, name, levelId);
    });
}

function openAddProductToLevel(projectId, levelId) {
    openProductSelectionModal((product) => {
        addProduct(projectId, product, levelId);
    });
}

function openAddProductToArea(projectId, areaId) {
    openProductSelectionModal((product) => {
        addProduct(projectId, product, areaId);
    });
}

function updateQuantity(projectId, itemId, quantity) {
    const project = db.getProject(projectId);
    const item = findItemInStructure(project.structure, itemId);
    if (item) {
        item.quantity = parseInt(quantity) || 1;
        db.updateProject(projectId, project);
        showNotification('Quantity updated!');
    }
}

function deleteItemConfirm(projectId, itemId, itemType) {
    const typeLabel = itemType === 'level' ? 'level' : itemType === 'area' ? 'area' : 'product';
    openDeleteConfirmModal(`Delete this ${typeLabel}?`, () => {
        const project = db.getProject(projectId);
        deleteItemFromStructure(project.structure, itemId);
        db.updateProject(projectId, project);
        renderProjectHierarchy(projectId);
        showNotification('Item deleted!', 'warning');
    });
}

function deleteItemFromStructure(structure, itemId) {
    for (let i = 0; i < structure.length; i++) {
        if (structure[i].id === itemId) {
            structure.splice(i, 1);
            return true;
        }
        if (structure[i].children) {
            if (deleteItemFromStructure(structure[i].children, itemId)) return true;
        }
    }
    return false;
}

// ==================== SUMMARY VIEW ====================
function openSummaryModal(projectId) {
    const project = db.getProject(projectId);
    const client = db.getClient(project.clientId);
    
    const stats = calculateProjectStats(project.structure);
    
    let html = `
        <h2 style="margin-bottom: 20px;">${project.name} - Summary</h2>
        <p style="color: #666; margin-bottom: 20px;">Client: <strong>${client.name}</strong></p>
        
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-number">${stats.levels}</div>
                <div class="stat-label">Levels</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.areas}</div>
                <div class="stat-label">Areas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.products}</div>
                <div class="stat-label">Products</div>
            </div>
        </div>

        <h3 style="margin-top: 30px; margin-bottom: 15px;">📦 Complete Products Summary</h3>
    `;
    
    html += `<table class="summary-table">
        <thead>
            <tr>
                <th>No</th>
                <th>Product Name</th>
                <th>Company</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Photo</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    let totalPrice = 0;
    let productIndex = 1;
    const productMap = {};
    
    collectProducts(project.structure, productMap);
    
    for (const [productId, data] of Object.entries(productMap)) {
        const product = db.getProduct(parseInt(productId));
        if (product) {
            const total = (product.price || 0) * data.quantity;
            totalPrice += total;
            const photoHTML = product.imageBase64 ? `<img src="${product.imageBase64}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : '-';
            html += `
                <tr>
                    <td>${productIndex++}</td>
                    <td>${product.name}</td>
                    <td>${product.company || '-'}</td>
                    <td>${product.type || '-'}</td>
                    <td>${data.quantity}</td>
                    <td>$${(product.price || 0).toFixed(2)}</td>
                    <td>$${total.toFixed(2)}</td>
                    <td style="text-align: center;">${photoHTML}</td>
                </tr>
            `;
        }
    }
    
    html += `
                <tr class="total-row">
                    <td colspan="7"><strong>Total Price:</strong></td>
                    <td><strong>$${totalPrice.toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>
    `;

    // Installation Cost with Dual Fields
    html += `
        <h3 style="margin-top: 30px; margin-bottom: 15px;">💰 Installation Cost</h3>
        <table class="summary-table">
            <tbody>
                <tr>
                    <td style="width: 50%;"><strong>Amount ($)</strong></td>
                    <td style="width: 50%;"><input type="number" id="installationCostAmount" value="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 1em;" onchange="updateInstallationFromAmount(${totalPrice})"></td>
                </tr>
                <tr>
                    <td><strong>Percentage (%)</strong></td>
                    <td><input type="number" id="installationCostPercent" value="0" step="0.01" min="0" max="100" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 1em;" onchange="updateInstallationFromPercent(${totalPrice})"></td>
                </tr>
            </tbody>
        </table>
    `;

    html += `
        <h3 style="margin-top: 30px; margin-bottom: 15px;">Grand Total</h3>
        <table class="summary-table">
            <tbody>
                <tr class="grand-total-row">
                    <td colspan="7"><strong>Total Price + Installation:</strong></td>
                    <td><strong>$<span id="grandTotal">${totalPrice.toFixed(2)}</span></strong></td>
                </tr>
            </tbody>
        </table>
    `;

    // TABLE 2: Products by Area - Each product in separate row
    html += `<h3 style="margin-top: 30px; margin-bottom: 15px;">📂 Products by Area</h3>`;
    html += `<table class="summary-table">
        <thead>
            <tr>
                <th>Area Name</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Comment</th>
            </tr>
        </thead>
        <tbody>
    `;

    const areasData = collectAreaDataDetailed(project.structure);
    areasData.forEach((area, areaIndex) => {
        if (area.products.length === 0) {
            html += `<tr>
                <td><strong>${area.name}</strong></td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            </tr>`;
        } else {
            area.products.forEach((product, productIdx) => {
                html += `<tr>
                    ${productIdx === 0 ? `<td rowspan="${area.products.length}"><strong>${area.name}</strong></td>` : ''}
                    <td>${product.name}</td>
                    <td>${area.quantities[productIdx]}</td>
                    <td>${product.comment || '-'}</td>
                </tr>`;
            });
        }
    });

    html += `</tbody></table>`;

    html += `<div style="margin-top: 30px; display: flex; gap: 10px;">
        <button class="export-button" onclick="exportToExcel(${projectId}, '${project.name}', '${client.name}', ${totalPrice})">📥 Export to Excel</button>
        <button class="btn btn-secondary" onclick="closeSummaryModal()">Close</button>
    </div>`;

    document.getElementById('summaryContent').innerHTML = html;
    document.getElementById('summaryModal').classList.add('show');
}

function closeSummaryModal() {
    document.getElementById('summaryModal').classList.remove('show');
}

function updateInstallationFromAmount(totalPrice) {
    const amount = parseFloat(document.getElementById('installationCostAmount').value) || 0;
    const percentage = totalPrice > 0 ? (amount / totalPrice * 100) : 0;
    document.getElementById('installationCostPercent').value = percentage.toFixed(2);
    updateGrandTotal(totalPrice);
}

function updateInstallationFromPercent(totalPrice) {
    const percentage = parseFloat(document.getElementById('installationCostPercent').value) || 0;
    const amount = (totalPrice * percentage / 100);
    document.getElementById('installationCostAmount').value = amount.toFixed(2);
    updateGrandTotal(totalPrice);
}

function updateGrandTotal(totalPrice) {
    const installationCost = parseFloat(document.getElementById('installationCostAmount').value) || 0;
    const grandTotal = totalPrice + installationCost;
    document.getElementById('grandTotal').textContent = grandTotal.toFixed(2);
}

function calculateProjectStats(structure) {
    let levels = 0, areas = 0, products = 0;
    
    function traverse(items) {
        items.forEach(item => {
            if (item.type === 'level') levels++;
            if (item.type === 'area') areas++;
            if (item.type === 'product') products++;
            if (item.children) traverse(item.children);
        });
    }
    
    traverse(structure);
    return { levels, areas, products };
}

function collectProducts(structure, productMap) {
    structure.forEach(item => {
        if (item.type === 'product') {
            if (!productMap[item.productId]) {
                productMap[item.productId] = { quantity: 0 };
            }
            productMap[item.productId].quantity += item.quantity;
        }
        if (item.children) collectProducts(item.children, productMap);
    });
}

function collectAreaDataDetailed(structure) {
    const areas = [];
    
    function traverse(items) {
        items.forEach(item => {
            if (item.type === 'area') {
                const products = [];
                const quantities = [];
                
                function collectAreaProducts(children) {
                    children.forEach(child => {
                        if (child.type === 'product') {
                            const product = db.getProduct(child.productId);
                            products.push(product);
                            quantities.push(child.quantity);
                        }
                        if (child.children) collectAreaProducts(child.children);
                    });
                }
                
                collectAreaProducts(item.children || []);
                areas.push({
                    name: item.name,
                    products: products,
                    quantities: quantities
                });
            }
            if (item.children) traverse(item.children);
        });
    }
    
    traverse(structure);
    return areas;
}

// ==================== EXPORT TO EXCEL WITH PROPER TABLES ====================
function exportToExcel(projectId, projectName, clientName, totalPrice) {
    const project = db.getProject(projectId);
    const stats = calculateProjectStats(project.structure);
    const productMap = {};
    collectProducts(project.structure, productMap);
    
    // Create a proper Excel XML format
    let xlsContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${projectName} - Summary</Title>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="s62">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#667eea"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#667eea"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#667eea"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#667eea"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#667eea" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s63">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11"/>
   <Interior ss:Color="#F9F9F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s64">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11"/>
   <Interior ss:Color="#F9F9F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s65">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CCCCCC"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11"/>
   <Interior ss:Color="#F9F9F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s66">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFC107"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFC107"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFC107"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FFC107"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#FFF9E6" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="s67">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#667eea"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#667eea"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#667eea"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#667eea"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#667eea" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Project Summary">
  <Table ss:ExpandedColumnCount="8" ss:ExpandedRowCount="50" x:FullColumns="1"
   x:FullRows="1" ss:DefaultColumnWidth="60" ss:DefaultRowHeight="15">`;

    // Add header section
    xlsContent += `
   <Row ss:Height="20">
    <Cell ss:MergeAcross="7"><Data ss:Type="String"><b>Project: ${projectName}</b></Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="7"><Data ss:Type="String">Client: ${clientName}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="7"><Data ss:Type="String">Date Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</Data></Cell>
   </Row>
   <Row>
    <Cell></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell><Data ss:Type="String"><b>Project Statistics</b></Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Levels: ${stats.levels}</Data></Cell>
    <Cell><Data ss:Type="String">Areas: ${stats.areas}</Data></Cell>
    <Cell><Data ss:Type="String">Products: ${stats.products}</Data></Cell>
   </Row>
   <Row>
    <Cell></Cell>
   </Row>`;

    // Products Summary Table Header
    xlsContent += `
   <Row ss:Height="20">
    <Cell ss:MergeAcross="7"><Data ss:Type="String"><b>Complete Products Summary</b></Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="s62"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Product Name</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Company</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Type</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Qty</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Price</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Total</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Photo</Data></Cell>
   </Row>`;

    // Products data
    let productIndex = 1;
    let rowNum = 0;
    for (const [productId, dataObj] of Object.entries(productMap)) {
        const product = db.getProduct(parseInt(productId));
        if (product) {
            const total = (product.price || 0) * dataObj.quantity;
            xlsContent += `
   <Row ss:Height="30">
    <Cell ss:StyleID="s64"><Data ss:Type="Number">${productIndex++}</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">${product.name}</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">${product.company || '-'}</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">${product.type || '-'}</Data></Cell>
    <Cell ss:StyleID="s64"><Data ss:Type="Number">${dataObj.quantity}</Data></Cell>
    <Cell ss:StyleID="s65"><Data ss:Type="Number">${(product.price || 0).toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="s65"><Data ss:Type="Number">${total.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="s64"><Data ss:Type="String">${product.imageBase64 ? '[Image]' : '-'}</Data></Cell>
   </Row>`;
        }
    }

    const installationCost = parseFloat(document.getElementById('installationCostAmount').value) || 0;
    const grandTotal = totalPrice + installationCost;
    const installationPercent = parseFloat(document.getElementById('installationCostPercent').value) || 0;

    // Totals
    xlsContent += `
   <Row ss:Height="18">
    <Cell ss:MergeAcross="5" ss:StyleID="s66"><Data ss:Type="String"><b>Total Price:</b></Data></Cell>
    <Cell ss:StyleID="s66"><Data ss:Type="Number">${totalPrice.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="s63"></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="5" ss:StyleID="s66"><Data ss:Type="String"><b>Installation Cost (${installationPercent}%):</b></Data></Cell>
    <Cell ss:StyleID="s66"><Data ss:Type="Number">${installationCost.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="s63"></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="5" ss:StyleID="s67"><Data ss:Type="String"><b>Grand Total:</b></Data></Cell>
    <Cell ss:StyleID="s67"><Data ss:Type="Number">${grandTotal.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="s67"></Cell>
   </Row>
   <Row>
    <Cell></Cell>
   </Row>`;

    // Products by Area Table
    const areasData = collectAreaDataDetailed(project.structure);
    xlsContent += `
   <Row ss:Height="20">
    <Cell ss:MergeAcross="3"><Data ss:Type="String"><b>Products by Area</b></Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:StyleID="s62"><Data ss:Type="String">Area Name</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Product</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Quantity</Data></Cell>
    <Cell ss:StyleID="s62"><Data ss:Type="String">Comment</Data></Cell>
   </Row>`;

    if (areasData.length === 0) {
        xlsContent += `
   <Row>
    <Cell ss:MergeAcross="3" ss:StyleID="s63"><Data ss:Type="String">No areas defined in this project</Data></Cell>
   </Row>`;
    } else {
        areasData.forEach(area => {
            if (area.products.length === 0) {
                xlsContent += `
   <Row>
    <Cell ss:StyleID="s63"><Data ss:Type="String">${area.name}</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">-</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">-</Data></Cell>
   </Row>`;
            } else {
                area.products.forEach((product, idx) => {
                    xlsContent += `
   <Row>
    ${idx === 0 ? `<Cell ss:StyleID="s63"><Data ss:Type="String">${area.name}</Data></Cell>` : `<Cell ss:StyleID="s63"></Cell>`}
    <Cell ss:StyleID="s63"><Data ss:Type="String">${product.name}</Data></Cell>
    <Cell ss:StyleID="s64"><Data ss:Type="Number">${area.quantities[idx]}</Data></Cell>
    <Cell ss:StyleID="s63"><Data ss:Type="String">${product.comment || '-'}</Data></Cell>
   </Row>`;
                });
            }
        });
    }

    xlsContent += `
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>
   </PageSetup>
   <Print>
    <ValidPrinterInfo/>
    <HorizontalResolution>300</HorizontalResolution>
    <VerticalResolution>300</VerticalResolution>
   </Print>
   <Selected/>
   <Panes>
    <Pane>
     <Number>3</Number>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

    // Create blob and download
    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName}-Summary.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Project exported to Excel successfully!', 'success');
}
// ==================== INITIALIZE ====================
renderProducts();
renderClients();
renderProjects();
updateProjectClientDropdown();