// ============================================================
//  Home Page Logic
// ============================================================

import { Cart, updateCartBadge, showToast, initHeader, formatPrice } from './cart-utils.js';
import { getFeaturedProducts, getAccessories } from './products-data.js';
import { initScrollFX } from './scroll-fx.js';

function buildCard(product) {
  const badge = product.badge
    ? `<span class="badge badge-new">${product.badge}</span>`
    : '';
  return `
    <article class="product-card sfx-scale"
      onclick="window.location.href='Producto/index.html?id=${product.id}'"
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
          <button class="add-to-cart-btn" data-id="${product.id}" onclick="event.stopPropagation()">
            + Agregar
          </button>
        </div>
      </div>
    </article>`;
}

function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  grid.innerHTML = getFeaturedProducts().map(p => buildCard(p)).join('');
}

function renderAccessories() {
  const grid = document.getElementById('accessoriesGrid');
  if (!grid) return;
  grid.innerHTML = getAccessories().map(p => buildCard(p)).join('');
}

function initAddToCart() {
  document.querySelectorAll('.product-grid').forEach(grid => {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.add-to-cart-btn');
      if (!btn) return;

      const id = btn.dataset.id;
      const card = btn.closest('.product-card');
      const name = card.querySelector('.product-name').textContent;
      const priceText = card.querySelector('.product-price').textContent;
      const image = card.querySelector('img').src;
      const category = card.querySelector('.product-category').textContent.trim().split('\n')[0].trim();
      const price = parseFloat(priceText.replace(/[^0-9,.]/g, '').replace(',', '.'));

      Cart.add({ id, name, price, image, category });
      updateCartBadge();
      showToast(`${name} agregado al carrito`, 'success', image);

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
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  updateCartBadge();
  renderFeatured();
  renderAccessories();
  initAddToCart();
  setTimeout(() => {
    initReveal();
    initScrollFX();
  }, 80);
});
