// ============================================================
//  Cart Page Logic
// ============================================================

import { Cart, applyPromo, updateCartBadge, showToast, initHeader, formatPrice } from '../js/cart-utils.js';

let appliedDiscount = 0; // discount amount in currency

// ---- Build cart item row ----
function buildItem(item) {
  return `
    <div class="cart-item" id="item-${item.id}" data-id="${item.id}">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-category">${item.category}</div>
        <div class="cart-item-price">${formatPrice(item.price)} c/u</div>
      </div>
      <div class="qty-control" aria-label="Cantidad">
        <button class="qty-btn qty-minus" data-id="${item.id}" aria-label="Reducir cantidad">−</button>
        <input
          type="number"
          class="qty-input"
          value="${item.qty}"
          min="1"
          max="99"
          data-id="${item.id}"
          aria-label="Cantidad"
        >
        <button class="qty-btn qty-plus" data-id="${item.id}" aria-label="Aumentar cantidad">+</button>
      </div>
      <div class="cart-item-subtotal">${formatPrice(item.price * item.qty)}</div>
      <button class="remove-btn" data-id="${item.id}" aria-label="Eliminar ${item.name}" title="Eliminar">✕</button>
    </div>`;
}

// ---- Render full cart ----
function renderCart() {
  const items = Cart.get();
  const cartEmpty = document.getElementById('cartEmpty');
  const cartContent = document.getElementById('cartContent');
  const cartList = document.getElementById('cartList');

  if (items.length === 0) {
    cartEmpty.style.display = '';
    cartContent.style.display = 'none';
    return;
  }

  cartEmpty.style.display = 'none';
  cartContent.style.display = '';
  cartList.innerHTML = items.map(buildItem).join('');
  updateSummary();
}

// ---- Update order summary ----
function updateSummary() {
  const subtotal = Cart.subtotal();
  const total = Math.max(0, subtotal - appliedDiscount);

  document.getElementById('summarySubtotal').textContent = formatPrice(subtotal);
  document.getElementById('summaryTotal').textContent = formatPrice(total);

  const discountRow = document.getElementById('discountRow');
  if (appliedDiscount > 0) {
    discountRow.style.display = '';
    document.getElementById('discountAmount').textContent = `−${formatPrice(appliedDiscount)}`;
  } else {
    discountRow.style.display = 'none';
  }
}

// ---- Promo code ----
function initPromo() {
  const btn = document.getElementById('promoBtn');
  const input = document.getElementById('promoInput');
  const feedback = document.getElementById('promoFeedback');

  btn.addEventListener('click', () => {
    const result = applyPromo(input.value);
    feedback.className = 'promo-feedback';

    if (result.valid) {
      appliedDiscount = result.discount;
      feedback.textContent = `✓ Código aplicado: ${result.percent}% de descuento`;
      feedback.classList.add('success');
      input.disabled = true;
      btn.disabled = true;
      updateSummary();
    } else {
      feedback.textContent = 'Código no válido. Verificá que esté bien escrito.';
      feedback.classList.add('error');
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  });
}

// ---- Quantity & remove events (delegated) ----
function initCartEvents() {
  const cartList = document.getElementById('cartList');
  if (!cartList) return;

  cartList.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('qty-minus')) {
      const item = Cart.get().find(i => i.id === id);
      if (item) {
        if (item.qty <= 1) {
          removeItemAnimated(id);
        } else {
          Cart.setQty(id, item.qty - 1);
          refreshItem(id);
        }
      }
    }

    if (e.target.classList.contains('qty-plus')) {
      const item = Cart.get().find(i => i.id === id);
      if (item) {
        Cart.setQty(id, item.qty + 1);
        refreshItem(id);
      }
    }

    if (e.target.classList.contains('remove-btn')) {
      removeItemAnimated(id);
    }
  });

  cartList.addEventListener('change', (e) => {
    if (!e.target.classList.contains('qty-input')) return;
    const id = e.target.dataset.id;
    const qty = parseInt(e.target.value, 10);
    if (isNaN(qty) || qty < 1) {
      removeItemAnimated(id);
    } else {
      Cart.setQty(id, qty);
      refreshItem(id);
    }
  });
}

function removeItemAnimated(id) {
  const row = document.getElementById(`item-${id}`);
  if (!row) return;
  row.classList.add('removing');
  row.addEventListener('transitionend', () => {
    Cart.remove(id);
    renderCart();
    updateCartBadge();
    showToast('Producto eliminado', 'default');
  }, { once: true });
}

function refreshItem(id) {
  const item = Cart.get().find(i => i.id === id);
  if (!item) return;
  const row = document.getElementById(`item-${id}`);
  if (!row) return;
  row.querySelector('.qty-input').value = item.qty;
  row.querySelector('.cart-item-subtotal').textContent = formatPrice(item.price * item.qty);
  updateCartBadge();
  updateSummary();
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  updateCartBadge();
  renderCart();
  initCartEvents();
  initPromo();
});

// Sync if cart changes in another tab
window.addEventListener('storage', (e) => {
  if (e.key === 'iplace_cart') renderCart();
});
