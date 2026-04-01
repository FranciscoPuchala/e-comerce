// ============================================================
//  Cart Utilities  (shared across all pages)
//  Uses localStorage for persistence.
// ============================================================

const CART_KEY = 'iplace_cart';

export const Cart = {
  /** @returns {Array} */
  get() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
    } catch {
      return [];
    }
  },

  /** @param {Array} items */
  save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
  },

  /**
   * @param {{ id: string, name: string, price: number, image: string, category: string }} product
   * @param {number} [qty=1]
   */
  add(product, qty = 1) {
    const items = this.get();
    const existing = items.find(i => i.id === String(product.id));
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 99);
    } else {
      items.push({
        id: String(product.id),
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        qty,
      });
    }
    this.save(items);
  },

  /** @param {string} id */
  remove(id) {
    this.save(this.get().filter(i => i.id !== String(id)));
  },

  /**
   * @param {string} id
   * @param {number} qty
   */
  setQty(id, qty) {
    if (qty <= 0) { this.remove(id); return; }
    const items = this.get();
    const item = items.find(i => i.id === String(id));
    if (item) {
      item.qty = Math.min(qty, 99);
      this.save(items);
    }
  },

  clear() {
    this.save([]);
  },

  /** Total number of individual units */
  count() {
    return this.get().reduce((sum, i) => sum + i.qty, 0);
  },

  /** Subtotal before discounts */
  subtotal() {
    return this.get().reduce((sum, i) => sum + i.price * i.qty, 0);
  },
};

// ---- Promo codes ----
const PROMO_CODES = {
  IPLACE10:   0.10,
  BIENVENIDO: 0.15,
  PREMIUM20:  0.20,
};

/** @returns {{ valid: boolean, discount: number, percent: number }} */
export function applyPromo(code) {
  const pct = PROMO_CODES[code?.trim().toUpperCase()];
  if (!pct) return { valid: false, discount: 0, percent: 0 };
  const discount = Cart.subtotal() * pct;
  return { valid: true, discount, percent: pct * 100 };
}

// ---- UI helpers ----

/** Update every .cart-count element on the page */
export function updateCartBadge() {
  const count = Cart.count();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.classList.toggle('hidden', count === 0);
  });
}

/** Format a number as currency (ARS) */
export function formatPrice(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Show a toast notification
 * @param {string} message
 * @param {'default'|'success'|'error'} type
 * @param {string} [imgUrl] optional product image
 */
export function showToast(message, type = 'default', imgUrl = null) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast${type !== 'default' ? ' ' + type : ''}`;
  const icons = { success: '✓', error: '✕', default: 'ℹ' };
  const imgHtml = imgUrl
    ? `<img class="toast-img" src="${imgUrl}" alt="" loading="lazy">`
    : `<span class="toast-icon">${icons[type] ?? 'ℹ'}</span>`;
  toast.innerHTML = `${imgHtml}<span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3500);
}

// ---- Header scroll effect ----
export function initHeader() {
  const header = document.querySelector('.site-header');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }

  // Back to top button
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.innerHTML = '↑';
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Keep badge in sync with cart changes from other tabs
window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY) updateCartBadge();
});
