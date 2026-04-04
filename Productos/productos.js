// ============================================================
//  Products Page Logic
// ============================================================

import { Cart, Wishlist, updateCartBadge, showToast, initHeader, formatPrice } from '../js/cart-utils.js';
import { getAllProducts, getProductsByCategory, getCategories, invalidateCache } from '../js/products-db.js';

let activeCategory = 'Todos';
let activeSort = 'default';
let activePriceRange = 'all';
let activeSearch = '';
let allProducts = [];
let currentPage = 1;
const PAGE_SIZE = 12;

const PRICE_RANGES = {
  all:  [0, Infinity],
  low:  [0, 100000],
  mid:  [100000, 500000],
  high: [500000, Infinity],
};

function getCategoryFromURL() {
  return new URLSearchParams(window.location.search).get('categoria') ?? 'Todos';
}

function getStockBadge(productId) {
  const n = parseInt(productId, 10);
  if (!isNaN(n) && n % 4 === 0) {
    return `<span class="stock-badge stock-low">Últimas ${(n % 3) + 2} unidades</span>`;
  }
  return `<span class="stock-badge stock-in">En stock</span>`;
}

function buildCard(product) {
  const badge = product.badge ? `<span class="badge badge-new">${product.badge}</span>` : '';
  return `
    <article class="product-card" data-id="${product.id}"
      role="button" tabindex="0" aria-label="Ver ${product.name}">
      <div class="product-img-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-body">
        <span class="product-category">${product.category} ${badge}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        <div class="product-footer">
          <div>
            <span class="product-price">${formatPrice(product.price)}</span>
            ${getStockBadge(product.id)}
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <button class="wish-btn" data-id="${product.id}" aria-label="Favorito" title="Agregar a favoritos" style="background:none;border:none;cursor:pointer;font-size:1.1rem;padding:4px;color:${Wishlist.has(product.id) ? 'var(--error)' : 'var(--text-muted)'}">${Wishlist.has(product.id) ? '♥' : '♡'}</button>
            <button class="add-to-cart-btn" data-id="${product.id}">+ Agregar</button>
          </div>
        </div>
      </div>
    </article>`;
}

function applyFiltersAndSort(products) {
  const [min, max] = PRICE_RANGES[activePriceRange] ?? [0, Infinity];
  let result = products.filter(p => p.price >= min && p.price < max);

  if (activeSearch) {
    const q = activeSearch.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }

  if (activeSort === 'price-asc')  result = [...result].sort((a, b) => a.price - b.price);
  if (activeSort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
  if (activeSort === 'name-asc')   result = [...result].sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

function renderSkeletons(grid, count = 6) {
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line price"></div>
      </div>
    </div>`).join('');
}

async function renderCategories() {
  const container = document.getElementById('categoryFilter');
  if (!container) return;
  const cats = await getCategories();

  container.innerHTML = cats.map(cat => `
    <button class="filter-btn${cat === activeCategory ? ' active' : ''}" data-cat="${cat}">${cat}</button>
  `).join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    container.querySelectorAll('.filter-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.cat === activeCategory));
    renderProducts();
  });
}

function renderPagination(totalProducts) {
  let paginationEl = document.getElementById('pagination');
  if (!paginationEl) {
    paginationEl = document.createElement('div');
    paginationEl.id = 'pagination';
    paginationEl.className = 'pagination';
    document.getElementById('productGrid').after(paginationEl);
  }

  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) {
    html += `<button class="page-btn" data-page="${currentPage - 1}">‹ Anterior</button>`;
  }
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
  }
  if (currentPage < totalPages) {
    html += `<button class="page-btn" data-page="${currentPage + 1}">Siguiente ›</button>`;
  }
  paginationEl.innerHTML = html;

  paginationEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.page-btn');
    if (!btn) return;
    currentPage = parseInt(btn.dataset.page, 10);
    renderProducts(false);
    document.getElementById('productGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

async function renderProducts(resetPage = true) {
  const grid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');
  if (!grid) return;

  if (resetPage) currentPage = 1;

  renderSkeletons(grid);

  const base = await getProductsByCategory(activeCategory);
  const filtered = applyFiltersAndSort(base);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  noResults.style.display = filtered.length === 0 ? '' : 'none';
  noResults.textContent = activeSearch
    ? `No se encontraron productos para "${activeSearch}".`
    : 'No se encontraron productos en esta categoría.';
  grid.innerHTML = paginated.map(buildCard).join('');

  renderPagination(filtered.length);

  grid.querySelectorAll('.product-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    requestAnimationFrame(() => {
      setTimeout(() => {
        card.style.transition = 'opacity .4s cubic-bezier(0,0,0.2,1), transform .4s cubic-bezier(0,0,0.2,1), box-shadow .25s, border-color .25s';
        card.style.opacity = '1';
        card.style.transform = '';
      }, i * 60);
    });
  });
}

function initSortBar() {
  document.getElementById('sortSelect')?.addEventListener('change', e => {
    activeSort = e.target.value;
    renderProducts();
  });
  document.querySelectorAll('.price-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activePriceRange = btn.dataset.price;
      document.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProducts();
    });
  });
}

function initAddToCart() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.addEventListener('click', async (e) => {
    // Wishlist button
    const wishBtn = e.target.closest('.wish-btn');
    if (wishBtn) {
      const id = wishBtn.dataset.id;
      const { getAllProducts } = await import('../js/products-db.js');
      const list = await getAllProducts();
      const product = list.find(p => String(p.id) === id);
      const added = Wishlist.toggle(id);
      wishBtn.textContent = added ? '♥' : '♡';
      wishBtn.style.color = added ? 'var(--error)' : 'var(--text-muted)';
      if (product) showToast(added ? `${product.name} agregado a favoritos` : 'Eliminado de favoritos', added ? 'success' : 'default', added ? product.image : null);
      return;
    }

    const btn = e.target.closest('.add-to-cart-btn');
    if (btn) {
      const id = btn.dataset.id;
      const { getAllProducts } = await import('../js/products-db.js');
      const list = await getAllProducts();
      const product = list.find(p => String(p.id) === id);
      if (!product) return;

      Cart.add(product);
      updateCartBadge();
      showToast(`${product.name} agregado al carrito`, 'success', product.image);

      btn.textContent = '✓';
      btn.style.background = 'var(--success)';
      setTimeout(() => { btn.textContent = '+ Agregar'; btn.style.background = ''; }, 1500);

      document.getElementById('cartCount')?.classList.add('bump');
      setTimeout(() => document.getElementById('cartCount')?.classList.remove('bump'), 400);
      return;
    }

    const card = e.target.closest('.product-card');
    if (card) window.location.href = `../Producto/index.html?id=${card.dataset.id}`;
  });
}

function initSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    activeSearch = input.value.trim();
    clearBtn.style.display = activeSearch ? '' : 'none';
    debounceTimer = setTimeout(() => renderProducts(), 280);
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    activeSearch = '';
    clearBtn.style.display = 'none';
    input.focus();
    renderProducts();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  updateCartBadge();
  activeCategory = getCategoryFromURL();
  await renderCategories();
  initSortBar();
  initSearch();
  renderProducts();
  initAddToCart();
});
