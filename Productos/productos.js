// ============================================================
//  Products Page Logic
// ============================================================

import { Cart, updateCartBadge, showToast, initHeader, formatPrice } from '../js/cart-utils.js';
import { getAllProducts, getProductsByCategory, getCategories, invalidateCache } from '../js/products-db.js';

let activeCategory = 'Todos';
let activeSort = 'default';
let activePriceRange = 'all';
let allProducts = [];

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
          <button class="add-to-cart-btn" data-id="${product.id}">+ Agregar</button>
        </div>
      </div>
    </article>`;
}

function applyFiltersAndSort(products) {
  const [min, max] = PRICE_RANGES[activePriceRange] ?? [0, Infinity];
  let result = products.filter(p => p.price >= min && p.price < max);
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

async function renderProducts() {
  const grid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');
  if (!grid) return;

  renderSkeletons(grid);

  const base = await getProductsByCategory(activeCategory);
  const products = applyFiltersAndSort(base);

  noResults.style.display = products.length === 0 ? '' : 'none';
  grid.innerHTML = products.map(buildCard).join('');

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

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  updateCartBadge();
  activeCategory = getCategoryFromURL();
  await renderCategories();
  initSortBar();
  renderProducts();
  initAddToCart();
});
