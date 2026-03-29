// ============================================================
//  Home Page Logic
// ============================================================

import { Cart, updateCartBadge, showToast, initHeader, formatPrice } from './cart-utils.js';
import { getFeaturedProducts, getAccessories } from './products-data.js';

// ---- Build a product card HTML ----
function buildCard(product) {
  const badge = product.badge
    ? `<span class="badge badge-new">${product.badge}</span>`
    : '';
  return `
    <article class="product-card fade-in-up" data-id="${product.id}">
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

// ---- Render grids ----
function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const products = getFeaturedProducts();
  grid.innerHTML = products.map(buildCard).join('');
}

function renderAccessories() {
  const grid = document.getElementById('accessoriesGrid');
  if (!grid) return;
  const products = getAccessories();
  grid.innerHTML = products.map(buildCard).join('');
}

// ---- Add to cart handler (event delegation) ----
function initAddToCart() {
  document.querySelectorAll('.product-grid').forEach(grid => {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-cart-btn');
      if (!btn) return;
      e.stopPropagation();

      const id = btn.dataset.id;
      const card = btn.closest('.product-card');
      const name = card.querySelector('.product-name').textContent;
      const priceText = card.querySelector('.product-price').textContent;
      const image = card.querySelector('img').src;
      const category = card.querySelector('.product-category').textContent.trim();
      // Parse formatted price back to number
      const price = parseFloat(priceText.replace(/[^0-9,]/g, '').replace(',', '.'));

      Cart.add({ id, name, price, image, category });
      updateCartBadge();
      showToast(`${name} agregado al carrito`, 'success');

      btn.textContent = '✓ Agregado';
      btn.style.background = 'var(--success)';
      setTimeout(() => {
        btn.textContent = '+ Agregar';
        btn.style.background = '';
      }, 1500);
    });
  });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  updateCartBadge();
  renderFeatured();
  renderAccessories();
  initAddToCart();
});
