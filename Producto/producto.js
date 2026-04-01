// ============================================================
//  Product Detail Page
// ============================================================

import { Cart, updateCartBadge, showToast, initHeader, formatPrice } from '../js/cart-utils.js';
import { getProductById, getRelatedProducts } from '../js/products-data.js';

let qty = 1;

function getIdFromURL() {
  return new URLSearchParams(window.location.search).get('id');
}

function renderProduct(product) {
  document.title = `${product.name} — iPlace`;

  document.getElementById('detailImg').src = product.image;
  document.getElementById('detailImg').alt = product.name;
  document.getElementById('detailCategory').textContent = product.category;
  const bc = document.getElementById('breadcrumbProduct');
  if (bc) bc.textContent = product.name;
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailPrice').textContent = formatPrice(product.price);
  document.getElementById('detailDesc').textContent = product.description;

  // Features
  const featuresEl = document.getElementById('detailFeatures');
  if (product.features?.length) {
    featuresEl.innerHTML = product.features.map(f => `
      <div class="feature-row">
        <span class="feature-row-icon">${f.icon}</span>
        <div class="feature-row-text">
          <div class="feature-row-label">${f.label}</div>
          <div class="feature-row-value">${f.value}</div>
        </div>
      </div>
    `).join('');
  }
}

function renderRelated(productId) {
  const related = getRelatedProducts(productId, 4);
  const grid = document.getElementById('relatedGrid');
  if (!grid) return;

  grid.innerHTML = related.map((p, i) => `
    <article class="product-card reveal reveal-delay-${i + 1}" onclick="window.location.href='../Producto/index.html?id=${p.id}'">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-body">
        <span class="product-category">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <span class="product-price">${formatPrice(p.price)}</span>
          <button class="add-to-cart-btn" data-id="${p.id}" onclick="event.stopPropagation()">
            + Agregar
          </button>
        </div>
      </div>
    </article>
  `).join('');

  // Add to cart from related
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;
    e.stopPropagation();
    const p = related.find(r => r.id === btn.dataset.id);
    if (!p) return;
    Cart.add(p);
    updateCartBadge();
    showToast(`${p.name} agregado al carrito`, 'success');
    btn.textContent = '✓';
    setTimeout(() => { btn.textContent = '+ Agregar'; }, 1500);
  });
}

function initQtySelector(product) {
  const minus = document.getElementById('qtyMinus');
  const plus = document.getElementById('qtyPlus');
  const display = document.getElementById('qtyValue');

  minus.addEventListener('click', () => {
    if (qty > 1) {
      qty--;
      display.textContent = qty;
      display.animate([{ transform: 'scale(0.8)' }, { transform: 'scale(1)' }], { duration: 200 });
    }
  });
  plus.addEventListener('click', () => {
    if (qty < 99) {
      qty++;
      display.textContent = qty;
      display.animate([{ transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 200 });
    }
  });

  document.getElementById('addToCartBtn').addEventListener('click', (e) => {
    Cart.add(product, qty);
    updateCartBadge();
    showToast(`${product.name} agregado al carrito`, 'success', product.image);

    const btn = e.currentTarget;
    btn.textContent = '✓ Agregado';
    btn.style.background = 'var(--success)';
    setTimeout(() => {
      btn.textContent = '🛒 Agregar al carrito';
      btn.style.background = '';
    }, 1800);

    // Bump cart count
    document.getElementById('cartCount')?.classList.add('bump');
    setTimeout(() => document.getElementById('cartCount')?.classList.remove('bump'), 400);
  });
}

// ---- Scroll reveal ----
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

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  updateCartBadge();

  const id = getIdFromURL();
  const product = id ? getProductById(id) : null;

  if (!product) {
    document.getElementById('productNotFound').style.display = '';
    return;
  }

  document.getElementById('productContent').style.display = '';
  renderProduct(product);
  renderRelated(id);
  initQtySelector(product);

  // Small delay so DOM is painted before observing
  setTimeout(initReveal, 50);
});
