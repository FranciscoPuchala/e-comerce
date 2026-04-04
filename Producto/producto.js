// ============================================================
//  Product Detail Page
// ============================================================

import { Cart, Wishlist, updateCartBadge, showToast, initHeader, formatPrice } from '../js/cart-utils.js';
import { getProductById, getRelatedProducts } from '../js/products-db.js';
import { auth, db } from '../js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection, addDoc, query, where, orderBy,
  getDocs, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let qty = 1;

function getIdFromURL() {
  return new URLSearchParams(window.location.search).get('id');
}

function updateMetaTags(product) {
  // Update OG tags dynamically
  const setMeta = (sel, val) => { const el = document.querySelector(sel); if (el) el.setAttribute('content', val); };
  setMeta('meta[property="og:title"]', `${product.name} — iPlace`);
  setMeta('meta[property="og:description"]', product.description ?? 'Compra en iPlace con garantía oficial Apple.');
  setMeta('meta[property="og:image"]', product.image);
  setMeta('meta[name="description"]', `${product.name} — ${product.description ?? ''} Envío gratis y cuotas sin interés.`);

  // Schema.org Product structured data
  const existing = document.getElementById('productSchema');
  if (existing) existing.remove();
  const schema = document.createElement('script');
  schema.id = 'productSchema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { '@type': 'Brand', name: 'Apple' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ARS',
      price: product.price,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'iPlace' },
    },
  });
  document.head.appendChild(schema);
}

function renderProduct(product) {
  document.title = `${product.name} — iPlace`;
  updateMetaTags(product);

  document.getElementById('detailImg').src = product.image;
  document.getElementById('detailImg').alt = product.name;
  document.getElementById('detailCategory').textContent = product.category;
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailPrice').textContent = formatPrice(product.price);
  document.getElementById('detailDesc').textContent = product.description;

  const bc = document.getElementById('breadcrumbProduct');
  if (bc) bc.textContent = product.name;

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

function renderRelated(related) {
  const grid = document.getElementById('relatedGrid');
  if (!grid) return;

  grid.innerHTML = related.map((p, i) => `
    <article class="product-card reveal reveal-delay-${i + 1}" data-id="${p.id}"
      role="button" tabindex="0" aria-label="Ver ${p.name}">
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-body">
        <span class="product-category">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <span class="product-price">${formatPrice(p.price)}</span>
          <button class="add-to-cart-btn" data-id="${p.id}">+ Agregar</button>
        </div>
      </div>
    </article>
  `).join('');

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (btn) {
      const p = related.find(r => String(r.id) === btn.dataset.id);
      if (!p) return;
      Cart.add(p);
      updateCartBadge();
      showToast(`${p.name} agregado al carrito`, 'success', p.image);
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = '+ Agregar'; }, 1500);
      return;
    }
    const card = e.target.closest('.product-card');
    if (card) window.location.href = `../Producto/index.html?id=${card.dataset.id}`;
  });
}

function initQtySelector(product) {
  const minus   = document.getElementById('qtyMinus');
  const plus    = document.getElementById('qtyPlus');
  const display = document.getElementById('qtyValue');

  minus.addEventListener('click', () => {
    if (qty > 1) { qty--; display.textContent = qty; display.animate([{ transform: 'scale(0.8)' }, { transform: 'scale(1)' }], { duration: 200 }); }
  });
  plus.addEventListener('click', () => {
    if (qty < 99) { qty++; display.textContent = qty; display.animate([{ transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 200 }); }
  });

  document.getElementById('addToCartBtn').addEventListener('click', (e) => {
    Cart.add(product, qty);
    updateCartBadge();
    showToast(`${product.name} agregado al carrito`, 'success', product.image);

    const btn = e.currentTarget;
    btn.textContent = '✓ Agregado';
    btn.style.background = 'var(--success)';
    setTimeout(() => { btn.textContent = '🛒 Agregar al carrito'; btn.style.background = ''; }, 1800);

    document.getElementById('cartCount')?.classList.add('bump');
    setTimeout(() => document.getElementById('cartCount')?.classList.remove('bump'), 400);
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

// ---- Reviews ----

function starsHtml(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

async function loadReviews(productId) {
  const listEl = document.getElementById('reviewsList');
  if (!listEl) return;

  try {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', String(productId)),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      listEl.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem;padding:20px 0">Todavía no hay reseñas. ¡Sé el primero!</p>';
      return;
    }

    const reviews = snap.docs.map(d => d.data());
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    listEl.innerHTML = `
      <div class="reviews-summary">
        <div>
          <div class="reviews-avg">${avg.toFixed(1)}</div>
          <div class="reviews-avg-stars">${starsHtml(Math.round(avg))}</div>
          <div class="reviews-count">${reviews.length} reseña${reviews.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
      ${reviews.map(r => `
        <div class="review-item">
          <div class="review-header">
            <div>
              <div class="review-author">${r.authorName ?? 'Usuario'}</div>
              <div class="review-stars">${starsHtml(r.rating)}</div>
            </div>
            <div class="review-date">${r.createdAt?.toDate?.() ? r.createdAt.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</div>
          </div>
          <div class="review-title">${r.title}</div>
          <div class="review-body">${r.body}</div>
        </div>`).join('')}`;
  } catch (err) {
    console.error('Reviews load error:', err);
    listEl.innerHTML = '';
  }
}

function initReviews(productId) {
  let selectedRating = 0;
  const stars = document.querySelectorAll('.star-btn');
  const formSection = document.getElementById('reviewFormSection');
  if (!formSection) return;

  // Star selector
  stars.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      const n = parseInt(btn.dataset.star);
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.star) <= n));
    });
    btn.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.star) <= selectedRating));
    });
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.star);
      stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.star) <= selectedRating));
    });
  });

  // Auth-aware form display
  onAuthStateChanged(auth, user => {
    const loginMsg = document.getElementById('reviewLoginMsg');
    const form = document.getElementById('reviewForm');
    if (user) {
      loginMsg.style.display = 'none';
      form.style.display = '';
    } else {
      loginMsg.style.display = '';
      form.style.display = 'none';
    }
  });

  // Submit
  document.getElementById('submitReviewBtn')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;

    const title = document.getElementById('reviewTitle').value.trim();
    const body = document.getElementById('reviewBody').value.trim();
    const errEl = document.getElementById('reviewFormError');
    errEl.style.display = 'none';

    if (!selectedRating) { errEl.textContent = 'Seleccioná una puntuación.'; errEl.style.display = ''; return; }
    if (!title) { errEl.textContent = 'Ingresá un título para tu reseña.'; errEl.style.display = ''; return; }
    if (!body) { errEl.textContent = 'Escribí un comentario.'; errEl.style.display = ''; return; }

    const btn = document.getElementById('submitReviewBtn');
    btn.disabled = true;
    btn.textContent = 'Publicando...';

    try {
      await addDoc(collection(db, 'reviews'), {
        productId: String(productId),
        rating: selectedRating,
        title,
        body,
        authorName: user.displayName ?? user.email?.split('@')[0] ?? 'Usuario',
        authorEmail: user.email,
        createdAt: serverTimestamp(),
      });
      showToast('¡Reseña publicada!', 'success');
      document.getElementById('reviewTitle').value = '';
      document.getElementById('reviewBody').value = '';
      selectedRating = 0;
      stars.forEach(s => s.classList.remove('active'));
      await loadReviews(productId);
    } catch (err) {
      errEl.textContent = 'Error al publicar. Intentá de nuevo.';
      errEl.style.display = '';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publicar reseña';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initHeader();
  updateCartBadge();

  const id = getIdFromURL();
  const product = id ? await getProductById(id) : null;

  if (!product) {
    document.getElementById('productNotFound').style.display = '';
    return;
  }

  document.getElementById('productContent').style.display = '';
  renderProduct(product);

  const related = await getRelatedProducts(id, 4);
  renderRelated(related);
  initQtySelector(product);
  setTimeout(initReveal, 50);
  loadReviews(id);
  initReviews(id);

  // Wishlist button
  const wishBtn = document.getElementById('wishlistBtn');
  if (wishBtn) {
    const updateWishBtn = () => {
      const inWish = Wishlist.has(id);
      wishBtn.textContent = inWish ? '♥' : '♡';
      wishBtn.style.color = inWish ? 'var(--error)' : '';
      wishBtn.setAttribute('aria-label', inWish ? 'Quitar de favoritos' : 'Agregar a favoritos');
      wishBtn.title = inWish ? 'Quitar de favoritos' : 'Agregar a favoritos';
    };
    updateWishBtn();
    wishBtn.addEventListener('click', () => {
      const added = Wishlist.toggle(id);
      updateWishBtn();
      showToast(added ? `${product.name} agregado a favoritos` : 'Eliminado de favoritos', added ? 'success' : 'default', added ? product.image : null);
    });
  }
});
