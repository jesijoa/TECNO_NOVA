/* ==========================================================
   TECNO NOVA - Módulo de Gestión de Catálogo de Productos
   GA6-220501096-AA4-EV03
   CRUD completo sobre LocalStorage (Create, Read, Update, Delete)
   ========================================================== */

const STORAGE_KEY = 'tecnonova_productos';

// ---------- Referencias del DOM ----------
const crudForm      = document.getElementById('crud-form');
const productGrid    = document.getElementById('product-grid');
const btnCancel      = document.getElementById('btn-cancel');
const formTitle      = document.getElementById('form-title');
const searchInput    = document.getElementById('search-input');
const chipFilters     = document.getElementById('chip-filters');

let currentCategoryFilter = 'Todas';
let currentSearchTerm = '';

const THEME_KEY = 'tecnonova_theme';
const themeToggleBtn = document.getElementById('theme-toggle');

// ---------- Arranque de la aplicación ----------
document.addEventListener('DOMContentLoaded', () => {
    seedIfEmpty();
    renderGrid();
    initTheme();
});

/* ==========================================================
   MODO CLARO / OSCURO
   ========================================================== */
function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    const icon = themeToggleBtn.querySelector('.theme-icon');
    const label = themeToggleBtn.querySelector('.theme-label');

    if (theme === 'dark') {
        icon.innerHTML = '&#127769;';         // luna (modo oscuro activo)
        label.textContent = 'Modo oscuro';
        themeToggleBtn.setAttribute('aria-pressed', 'true');
    } else {
        icon.innerHTML = '&#9728;&#65039;';   // sol (modo claro activo)
        label.textContent = 'Modo claro';
        themeToggleBtn.setAttribute('aria-pressed', 'false');
    }
}

themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ==========================================================
   REGLAS DE NEGOCIO / VALIDACIONES
   ========================================================== */
function validarReglasNegocio(name, category, price, stock, desc) {
    if (name.trim().length < 3) {
        alert('Regla de negocio: el nombre del producto debe tener al menos 3 caracteres.');
        return false;
    }
    if (!category) {
        alert('Regla de negocio: debe seleccionar una categoría.');
        return false;
    }
    if (isNaN(price) || price <= 0) {
        alert('Regla de negocio: el precio debe ser un número mayor a 0.');
        return false;
    }
    if (isNaN(stock) || stock < 0) {
        alert('Regla de negocio: las unidades disponibles no pueden ser negativas.');
        return false;
    }
    if (desc.trim().length < 5) {
        alert('Regla de negocio: la descripción debe tener al menos 5 caracteres.');
        return false;
    }
    return true;
}

/* ==========================================================
   PERSISTENCIA EN LOCALSTORAGE
   ========================================================== */
function getItemsFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveItemsToStorage(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Datos de ejemplo iniciales (solo si el catálogo está vacío)
function seedIfEmpty() {
    const items = getItemsFromStorage();
    if (items.length > 0) return;

    const seed = [
        { id: '1', name: 'Portátil Nova Pro 15”', category: 'Portatiles', price: 3200000, stock: 8, desc: 'Intel Core i7, 16GB RAM, SSD 512GB.' },
        { id: '2', name: 'Nova Phone X12', category: 'Celulares', price: 1450000, stock: 2, desc: 'Pantalla AMOLED 6.5”, 128GB, cámara triple.' },
        { id: '3', name: 'Audífonos Nova Sound', category: 'Accesorios', price: 189000, stock: 25, desc: 'Bluetooth 5.2, cancelación de ruido activa.' }
    ];
    saveItemsToStorage(seed);
}

/* ==========================================================
   CREATE & UPDATE (envío del formulario)
   ========================================================== */
crudForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id       = document.getElementById('item-id').value;
    const name     = document.getElementById('item-name').value;
    const category = document.getElementById('item-category').value;
    const price    = parseFloat(document.getElementById('item-price').value);
    const stock    = parseInt(document.getElementById('item-stock').value, 10);
    const desc     = document.getElementById('item-desc').value;

    if (!validarReglasNegocio(name, category, price, stock, desc)) return;

    let items = getItemsFromStorage();

    if (id === '') {
        // ---- CREATE ----
        const newItem = { id: Date.now().toString(), name, category, price, stock, desc };
        items.push(newItem);
    } else {
        // ---- UPDATE ----
        items = items.map(item => item.id === id ? { id, name, category, price, stock, desc } : item);
    }

    saveItemsToStorage(items);
    crudForm.reset();
    resetFormStatus();
    renderGrid();
});

/* ==========================================================
   READ (renderizado del catálogo con búsqueda y filtro)
   ========================================================== */
function renderGrid() {
    let items = getItemsFromStorage();

    if (currentCategoryFilter !== 'Todas') {
        items = items.filter(item => item.category === currentCategoryFilter);
    }
    if (currentSearchTerm.trim() !== '') {
        const term = normalizeText(currentSearchTerm);
        items = items.filter(item =>
            normalizeText(item.name).includes(term) ||
            normalizeText(nombreCategoria(item.category)).includes(term) ||
            normalizeText(item.category).includes(term)
        );
    }

    productGrid.innerHTML = '';

    if (items.length === 0) {
        productGrid.innerHTML = `
            <div class="empty-state">
                <p>No hay productos que coincidan con la búsqueda o el filtro seleccionado.</p>
            </div>`;
        return;
    }

    items.forEach(item => {
        const card = document.createElement('article');
        card.className = 'product-card';

        const stockBadgeClass = item.stock > 5 ? 'badge-stock-ok' : 'badge-stock-low';
        const stockLabel = item.stock > 0 ? `${item.stock} unidades` : 'Agotado';

        card.innerHTML = `
            <div class="card-top">
                <h3>${escapeHtml(item.name)}</h3>
                <span class="badge badge-category">${nombreCategoria(item.category)}</span>
            </div>
            <p class="price">$${Number(item.price).toLocaleString('es-CO')}</p>
            <span class="badge ${stockBadgeClass}">${stockLabel}</span>
            <p class="desc">${escapeHtml(item.desc)}</p>
            <div class="card-actions">
                <button class="btn btn-warning" data-action="edit" data-id="${item.id}">Editar</button>
                <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Eliminar</button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// Delegación de eventos para Editar / Eliminar
productGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'edit') editItem(id);
    if (btn.dataset.action === 'delete') deleteItem(id);
});

/* ==========================================================
   UPDATE (preparar formulario para edición)
   ========================================================== */
function editItem(id) {
    const items = getItemsFromStorage();
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-stock').value = item.stock;
    document.getElementById('item-desc').value = item.desc;

    formTitle.textContent = 'Modificar Producto';
    btnCancel.classList.remove('hidden');
    document.getElementById('item-name').focus();
}

/* ==========================================================
   DELETE
   ========================================================== */
function deleteItem(id) {
    if (!confirm('¿Está seguro de que desea eliminar este producto del catálogo?')) return;
    let items = getItemsFromStorage();
    items = items.filter(item => item.id !== id);
    saveItemsToStorage(items);
    renderGrid();
    resetFormStatus();
    crudForm.reset();
}

/* ==========================================================
   CANCELAR EDICIÓN
   ========================================================== */
btnCancel.addEventListener('click', () => {
    crudForm.reset();
    resetFormStatus();
});

function resetFormStatus() {
    document.getElementById('item-id').value = '';
    formTitle.textContent = 'Registrar Nuevo Producto';
    btnCancel.classList.add('hidden');
}

/* ==========================================================
   BÚSQUEDA Y FILTRO POR CATEGORÍA (chips)
   ========================================================== */
searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    renderGrid();
});

chipFilters.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    chipFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    currentCategoryFilter = chip.dataset.category;
    renderGrid();
});

/* ==========================================================
   UTILIDADES
   ========================================================== */
function nombreCategoria(cat) {
    const map = { Portatiles: 'Portátiles', Celulares: 'Celulares', Accesorios: 'Accesorios' };
    return map[cat] || cat;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Quita tildes y pasa a minúsculas para comparaciones de búsqueda más flexibles
// Ej: "Portátiles" y "portatiles" se consideran iguales
function normalizeText(str) {
    return str
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}
