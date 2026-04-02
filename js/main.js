// ============================================================
//  Home Page Logic
// ============================================================

import { Cart, updateCartBadge, showToast, initHeader, formatPrice } from './cart-utils.js';
import { getFeaturedProducts, getAccessories } from './products-db.js';
import { initScrollFX } from './scroll-fx.js';

function buildCard(product) {
  const badge = product.badge ? `<span class="badge badge-new">${product.badge}</span>` : '';
  return `
    <article class="product-card sfx-scale" data-id="${product.id}"
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
          <button class="add-to-cart-btn" data-id="${product.id}">+ Agregar</button>
        </div>
      </div>
    </article>`;
}

async function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const products = await getFeaturedProducts();
  grid.innerHTML = products.map(p => buildCard(p)).join('');
}

async function renderAccessories() {
  const grid = document.getElementById('accessoriesGrid');
  if (!grid) return;
  const products = await getAccessories();
  grid.innerHTML = products.map(p => buildCard(p)).join('');
}

function initAddToCart() {
  document.querySelectorAll('.product-grid').forEach(grid => {
    grid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.add-to-cart-btn');
      if (!btn) {
        const card = e.target.closest('.product-card');
        if (card) window.location.href = `Producto/index.html?id=${card.dataset.id}`;
        return;
      }

      const id = btn.dataset.id;
      const { getAllProducts } = await import('./products-db.js');
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
    });
  });
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  updateCartBadge();
  await Promise.all([renderFeatured(), renderAccessories()]);
  initAddToCart();
  setTimeout(() => { initReveal(); initScrollFX(); }, 80);
});
