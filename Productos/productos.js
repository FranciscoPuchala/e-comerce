// ============================================================
//  Products Page Logic
// ============================================================

import { Cart, updateCartBadge, showToast, initHeader, formatPrice } from '../js/cart-utils.js';
import { PRODUCTS, CATEGORIES, getProductsByCategory } from '../js/products-data.js';

let activeCategory = 'Todos';

function getCategoryFromURL() {
  return new URLSearchParams(window.location.search).get('categoria') ?? 'Todos';
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
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="add-to-cart-btn" data-id="${product.id}">
            + Agregar
          </button>
        </div>
      </div>
    </article>`;
}

function renderCategories() {
  const container = document.getElementById('categoryFilter');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <button class="filter-btn${cat === activeCategory ? ' active' : ''}" data-cat="${cat}">
      ${cat}
    </button>
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

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const noResults = document.getElementById('noResults');
  if (!grid) return;

  const products = getProductsByCategory(activeCategory);
  noResults.style.display = products.length === 0 ? '' : 'none';
  grid.innerHTML = products.map(buildCard).join('');

  // Staggered entrance animation
  grid.querySelectorAll('.product-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(28px)';
    requestAnimationFrame(() => {
      setTimeout(() => {
        card.style.transition = 'opacity 0.45s cubic-bezier(0,0,0.2,1), transform 0.45s cubic-bezier(0,0,0.2,1), box-shadow 0.25s, border-color 0.25s';
        card.style.opacity = '1';
        card.style.transform = '';
      }, i * 70);
    });
  });
}

function initAddToCart() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');

    if (btn) {
      // Add to cart — stop here, don't navigate
      const id = btn.dataset.id;
      const product = PRODUCTS.find(p => p.id === id);
      if (!product) return;

      Cart.add(product);
      updateCartBadge();
      showToast(`${product.name} agregado al carrito`, 'success');

      btn.textContent = '✓';
      btn.style.background = 'var(--success)';
      setTimeout(() => { btn.textContent = '+ Agregar'; btn.style.background = ''; }, 1500);

      document.getElementById('cartCount')?.classList.add('bump');
      setTimeout(() => document.getElementById('cartCount')?.classList.remove('bump'), 400);
      return;
    }

    // Click on card body → navigate to product
    const card = e.target.closest('.product-card');
    if (card) {
      window.location.href = `../Producto/index.html?id=${card.dataset.id}`;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  updateCartBadge();
  activeCategory = getCategoryFromURL();
  renderCategories();
  renderProducts();
  initAddToCart();
});
