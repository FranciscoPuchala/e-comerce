// ============================================================
//  iPlace Admin Panel — Logic
// ============================================================

import { auth, db } from '../js/firebase-config.js';
import { PRODUCTS, CATEGORIES } from '../js/products-data.js';
import {
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  query,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ============================================================
//  Auth guard — redirect to login if not authenticated
// ============================================================
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  // Show user info in sidebar
  const email = user.email ?? '';
  document.getElementById('sidebarEmail').textContent = email;
  document.getElementById('sidebarAvatar').textContent = email[0].toUpperCase();

  // Init the panel
  initAdmin();
});

// ============================================================
//  Logout
// ============================================================
document.getElementById('logoutBtn').addEventListener('click', doLogout);
document.getElementById('logoutBtn2').addEventListener('click', doLogout);
async function doLogout() {
  await signOut(auth);
  window.location.href = 'index.html';
}

// ============================================================
//  Toast
// ============================================================
function toast(msg, ok = true) {
  const container = document.getElementById('adminToasts');
  const el = document.createElement('div');
  el.className = 'admin-toast';
  el.textContent = (ok ? '✓ ' : '✗ ') + msg;
  container.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove());
  }, 3200);
}

// ============================================================
//  Tab navigation
// ============================================================
const TAB_TITLES = {
  dashboard: 'Dashboard',
  orders:    'Pedidos',
  messages:  'Mensajes',
  products:  'Productos',
};

let activeTab = 'dashboard';

function switchTab(tab) {
  if (!document.getElementById('tab-' + tab)) return;
  activeTab = tab;

  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');

  document.querySelectorAll('.sidebar-link[data-tab]').forEach(l =>
    l.classList.toggle('active', l.dataset.tab === tab));

  document.getElementById('topbarTitle').textContent = TAB_TITLES[tab] ?? tab;
}

document.querySelectorAll('.sidebar-link[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// "Ver todos" links inside dashboard cards
document.querySelectorAll('[data-tab-link]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tabLink));
});

// ============================================================
//  Formatters
// ============================================================
function fmtPrice(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortId(id) {
  return id ? id.slice(-8).toUpperCase() : '—';
}

// ============================================================
//  Status badge HTML
// ============================================================
const STATUS_LABELS = {
  pending:    'Pendiente',
  processing: 'En proceso',
  shipped:    'Enviado',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
};

function statusBadge(s) {
  const label = STATUS_LABELS[s] ?? s;
  return `<span class="badge badge-${s}">${label}</span>`;
}

function paymentBadge(m) {
  if (m === 'mercadopago') return `<span class="badge badge-mp">MercadoPago</span>`;
  if (m === 'transfer')    return `<span class="badge badge-transfer">Transferencia</span>`;
  return `<span class="badge">${m ?? '—'}</span>`;
}

// ============================================================
//  State
// ============================================================
let allOrders   = [];
let allMessages = [];

// ============================================================
//  ORDERS — real-time listener
// ============================================================
function initOrders() {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

  onSnapshot(q, snapshot => {
    allOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOrderStats();
    renderOrdersTable();
    renderRecentOrders();
    updateBadgePending();
  }, err => {
    console.error('Orders error:', err);
    document.getElementById('ordersBody').innerHTML =
      `<tr><td colspan="9" style="text-align:center;color:var(--error);padding:24px">Error al cargar pedidos.</td></tr>`;
  });
}

function updateBadgePending() {
  const count = allOrders.filter(o => o.status === 'pending').length;
  const badge = document.getElementById('badgePending');
  badge.textContent = count;
  badge.classList.toggle('zero', count === 0);
}

function renderOrderStats() {
  const total    = allOrders.length;
  const revenue  = allOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const pending  = allOrders.filter(o => o.status === 'pending').length;
  const today    = allOrders.filter(o => {
    if (!o.createdAt) return false;
    const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return d.toDateString() === new Date().toDateString();
  }).length;

  document.getElementById('statRevenue').textContent = fmtPrice(revenue);
  document.getElementById('statOrders').textContent  = total;
  document.getElementById('statOrdersSub').textContent = `${today} hoy`;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('orderCount').textContent  = `${total} pedido${total !== 1 ? 's' : ''}`;
}

// ---- Filters ----
let orderSearch = '';
let orderStatusF = '';
let orderPaymentF = '';

document.getElementById('orderSearch').addEventListener('input', e => {
  orderSearch = e.target.value.toLowerCase();
  renderOrdersTable();
});
document.getElementById('orderStatusFilter').addEventListener('change', e => {
  orderStatusF = e.target.value;
  renderOrdersTable();
});
document.getElementById('orderPaymentFilter').addEventListener('change', e => {
  orderPaymentF = e.target.value;
  renderOrdersTable();
});

function getFilteredOrders() {
  return allOrders.filter(o => {
    const name = `${o.customer?.firstName ?? ''} ${o.customer?.lastName ?? ''}`.toLowerCase();
    const email = (o.customer?.email ?? '').toLowerCase();
    const idStr = shortId(o.id).toLowerCase();
    const matchSearch = !orderSearch ||
      name.includes(orderSearch) ||
      email.includes(orderSearch) ||
      idStr.includes(orderSearch);
    const matchStatus  = !orderStatusF  || o.status === orderStatusF;
    const matchPayment = !orderPaymentF || o.paymentMethod === orderPaymentF;
    return matchSearch && matchStatus && matchPayment;
  });
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersBody');
  const orders = getFilteredOrders();
  document.getElementById('orderCount').textContent = `${orders.length} pedido${orders.length !== 1 ? 's' : ''}`;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">📭</div><h3>Sin resultados</h3><p>Probá cambiando los filtros.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const name = `${o.customer?.firstName ?? ''} ${o.customer?.lastName ?? ''}`.trim() || '—';
    const itemsCount = (o.items ?? []).reduce((s, i) => s + (i.qty ?? 1), 0);
    return `
    <tr>
      <td style="font-family:monospace;font-size:.78rem;color:var(--text-muted)">#${shortId(o.id)}</td>
      <td style="font-weight:500">${name}</td>
      <td style="color:var(--text-muted)">${o.customer?.email ?? '—'}</td>
      <td style="color:var(--text-muted)">${itemsCount} art.</td>
      <td style="font-weight:700">${fmtPrice(o.total)}</td>
      <td>${paymentBadge(o.paymentMethod)}</td>
      <td>
        <select class="status-select" data-id="${o.id}" aria-label="Estado del pedido">
          ${Object.entries(STATUS_LABELS).map(([v, l]) =>
            `<option value="${v}"${o.status === v ? ' selected' : ''}>${l}</option>`
          ).join('')}
        </select>
      </td>
      <td style="color:var(--text-muted);font-size:.78rem;white-space:nowrap">${fmtDate(o.createdAt)}</td>
      <td>
        <button class="admin-card-action view-order-btn" data-id="${o.id}">Ver</button>
      </td>
    </tr>`;
  }).join('');

  // Status change handlers
  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      const id = sel.dataset.id;
      const newStatus = sel.value;
      try {
        await updateDoc(doc(db, 'orders', id), { status: newStatus });
        toast('Estado actualizado');
      } catch (e) {
        toast('Error al actualizar estado', false);
        console.error(e);
      }
    });
  });

  // View order handlers
  tbody.querySelectorAll('.view-order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = allOrders.find(o => o.id === btn.dataset.id);
      if (order) openOrderModal(order);
    });
  });
}

// ---- Recent orders (dashboard tab) ----
function renderRecentOrders() {
  const tbody = document.getElementById('recentOrdersBody');
  const recent = allOrders.slice(0, 6);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">Sin pedidos aún.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(o => {
    const name = `${o.customer?.firstName ?? ''} ${o.customer?.lastName ?? ''}`.trim() || '—';
    return `
    <tr style="cursor:pointer" onclick="">
      <td style="font-family:monospace;font-size:.78rem;color:var(--text-muted)">#${shortId(o.id)}</td>
      <td style="font-weight:500">${name}</td>
      <td style="font-weight:700">${fmtPrice(o.total)}</td>
      <td>${paymentBadge(o.paymentMethod)}</td>
      <td>${statusBadge(o.status)}</td>
      <td style="color:var(--text-muted);font-size:.78rem">${fmtDate(o.createdAt)}</td>
    </tr>`;
  }).join('');
}

// ============================================================
//  ORDER MODAL
// ============================================================
const orderModal = document.getElementById('orderModal');
document.getElementById('modalClose').addEventListener('click', () =>
  orderModal.classList.remove('open'));
orderModal.addEventListener('click', e => {
  if (e.target === orderModal) orderModal.classList.remove('open');
});

function openOrderModal(o) {
  const name = `${o.customer?.firstName ?? ''} ${o.customer?.lastName ?? ''}`.trim() || '—';

  document.getElementById('modalOrderId').textContent = `Pedido #${shortId(o.id)}`;
  document.getElementById('modalOrderDate').textContent = fmtDate(o.createdAt);

  document.getElementById('modalCustomer').innerHTML = `
    <div class="modal-info-item"><div class="modal-info-label">Nombre</div><div class="modal-info-value">${name}</div></div>
    <div class="modal-info-item"><div class="modal-info-label">Email</div><div class="modal-info-value">${o.customer?.email ?? '—'}</div></div>
    <div class="modal-info-item"><div class="modal-info-label">Teléfono</div><div class="modal-info-value">${o.customer?.phone || '—'}</div></div>
  `;

  document.getElementById('modalAddress').innerHTML = `
    <div class="modal-info-item"><div class="modal-info-label">Dirección</div><div class="modal-info-value">${o.customer?.address ?? '—'}</div></div>
    <div class="modal-info-item"><div class="modal-info-label">Ciudad</div><div class="modal-info-value">${o.customer?.city ?? '—'}</div></div>
    <div class="modal-info-item"><div class="modal-info-label">C.P.</div><div class="modal-info-value">${o.customer?.zip || '—'}</div></div>
  `;

  const items = o.items ?? [];
  document.getElementById('modalItems').innerHTML = items.map(i => `
    <div class="modal-item-row">
      <div style="flex:1">
        <div class="modal-item-name">${i.name ?? '—'}</div>
        <div class="modal-item-qty">Cantidad: ${i.qty ?? 1}</div>
      </div>
      <div class="modal-item-price">${fmtPrice(i.subtotal ?? (i.price * i.qty))}</div>
    </div>
  `).join('');

  document.getElementById('modalTotal').textContent = fmtPrice(o.total);

  document.getElementById('modalPayment').innerHTML = `
    <div class="modal-info-item"><div class="modal-info-label">Método</div><div class="modal-info-value">${paymentBadge(o.paymentMethod)}</div></div>
    <div class="modal-info-item"><div class="modal-info-label">Estado</div><div class="modal-info-value">${statusBadge(o.status)}</div></div>
  `;

  orderModal.classList.add('open');
}

// ============================================================
//  MESSAGES — real-time listener
// ============================================================
function initMessages() {
  const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));

  onSnapshot(q, snapshot => {
    allMessages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMessageStats();
    renderMessagesList();
    renderRecentMessages();
    updateBadgeMessages();
  }, err => {
    console.error('Messages error:', err);
    document.getElementById('messagesList').innerHTML =
      `<div style="text-align:center;padding:24px;color:var(--error)">Error al cargar mensajes.</div>`;
  });
}

function updateBadgeMessages() {
  const count = allMessages.filter(m => !m.read).length;
  const badge = document.getElementById('badgeMessages');
  badge.textContent = count;
  badge.classList.toggle('zero', count === 0);
}

function renderMessageStats() {
  const unread = allMessages.filter(m => !m.read).length;
  document.getElementById('statMessages').textContent = unread;
  document.getElementById('msgCount').textContent =
    `${allMessages.length} mensaje${allMessages.length !== 1 ? 's' : ''}`;
}

// ---- Filters ----
let msgSearch = '';
let msgReadF  = '';

document.getElementById('msgSearch').addEventListener('input', e => {
  msgSearch = e.target.value.toLowerCase();
  renderMessagesList();
});
document.getElementById('msgReadFilter').addEventListener('change', e => {
  msgReadF = e.target.value;
  renderMessagesList();
});

function getFilteredMessages() {
  return allMessages.filter(m => {
    const matchSearch = !msgSearch ||
      (m.name ?? '').toLowerCase().includes(msgSearch) ||
      (m.email ?? '').toLowerCase().includes(msgSearch) ||
      (m.subject ?? '').toLowerCase().includes(msgSearch);
    const matchRead =
      !msgReadF ||
      (msgReadF === 'unread' && !m.read) ||
      (msgReadF === 'read' && m.read);
    return matchSearch && matchRead;
  });
}

function renderMessagesList() {
  const container = document.getElementById('messagesList');
  const msgs = getFilteredMessages();
  document.getElementById('msgCount').textContent =
    `${msgs.length} mensaje${msgs.length !== 1 ? 's' : ''}`;

  if (msgs.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✉️</div><h3>Sin mensajes</h3><p>Aquí aparecerán los mensajes del formulario de contacto.</p></div>`;
    return;
  }

  container.innerHTML = msgs.map(m => `
    <div class="msg-card${!m.read ? ' unread' : ''}" data-id="${m.id}">
      <div class="msg-avatar">${(m.name ?? '?')[0].toUpperCase()}</div>
      <div class="msg-body">
        <div class="msg-top">
          <span class="msg-name">${m.name ?? '—'}</span>
          ${!m.read ? '<span class="badge badge-unread" style="font-size:.65rem">Nuevo</span>' : ''}
          <span class="msg-date">${fmtDate(m.createdAt)}</span>
        </div>
        <div class="msg-subject">${m.subject ?? '—'}</div>
        <div class="msg-preview">${m.message ?? ''}</div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.msg-card').forEach(card => {
    card.addEventListener('click', () => {
      const msg = allMessages.find(m => m.id === card.dataset.id);
      if (msg) openMsgModal(msg);
    });
  });
}

// ---- Recent messages (dashboard tab) ----
function renderRecentMessages() {
  const container = document.getElementById('recentMessagesList');
  const recent = allMessages.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:32px 20px"><div class="empty-state-icon" style="font-size:1.8rem">✉️</div><h3>Sin mensajes aún</h3></div>`;
    return;
  }

  container.innerHTML = recent.map(m => `
    <div class="msg-card${!m.read ? ' unread' : ''}" data-id="${m.id}">
      <div class="msg-avatar">${(m.name ?? '?')[0].toUpperCase()}</div>
      <div class="msg-body">
        <div class="msg-top">
          <span class="msg-name">${m.name ?? '—'}</span>
          ${!m.read ? '<span class="badge badge-unread" style="font-size:.65rem">Nuevo</span>' : ''}
          <span class="msg-date">${fmtDate(m.createdAt)}</span>
        </div>
        <div class="msg-subject">${m.subject ?? '—'}</div>
        <div class="msg-preview">${m.message ?? ''}</div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.msg-card').forEach(card => {
    card.addEventListener('click', () => {
      const msg = allMessages.find(m => m.id === card.dataset.id);
      if (msg) openMsgModal(msg);
    });
  });
}

// ============================================================
//  MESSAGE MODAL
// ============================================================
const msgModal = document.getElementById('msgModal');
document.getElementById('msgModalClose').addEventListener('click', () =>
  msgModal.classList.remove('open'));
msgModal.addEventListener('click', e => {
  if (e.target === msgModal) msgModal.classList.remove('open');
});

async function openMsgModal(m) {
  document.getElementById('msgModalName').textContent    = m.name ?? '—';
  document.getElementById('msgModalDate').textContent    = fmtDate(m.createdAt);
  document.getElementById('msgModalEmail').textContent   = m.email ?? '—';
  document.getElementById('msgModalSubject').textContent = m.subject ?? '—';
  document.getElementById('msgModalBody').textContent    = m.message ?? '—';
  document.getElementById('msgModalReply').href =
    `mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject ?? '')}`;

  msgModal.classList.add('open');

  // Mark as read if not already
  if (!m.read) {
    try {
      await updateDoc(doc(db, 'contacts', m.id), { read: true });
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  }
}

// ============================================================
//  PRODUCTS — static from products-data.js
// ============================================================
function initProducts() {
  // Populate category filter
  const catSelect = document.getElementById('productCategoryFilter');
  CATEGORIES.filter(c => c !== 'Todos').forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });

  document.getElementById('productCount').textContent =
    `${PRODUCTS.length} producto${PRODUCTS.length !== 1 ? 's' : ''}`;

  renderProductsTable();

  let productSearch = '';
  let productCat    = '';

  document.getElementById('productSearch').addEventListener('input', e => {
    productSearch = e.target.value.toLowerCase();
    renderProductsTable(productSearch, productCat);
  });
  catSelect.addEventListener('change', e => {
    productCat = e.target.value;
    renderProductsTable(productSearch, productCat);
  });
}

function renderProductsTable(search = '', cat = '') {
  const tbody = document.getElementById('productsBody');
  let list = PRODUCTS;

  if (search) list = list.filter(p =>
    p.name.toLowerCase().includes(search) ||
    p.category.toLowerCase().includes(search));
  if (cat) list = list.filter(p => p.category === cat);

  document.getElementById('productCount').textContent =
    `${list.length} producto${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🔍</div><h3>Sin resultados</h3></div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td><img class="product-admin-img" src="${p.image}" alt="${p.name}" loading="lazy"></td>
      <td style="font-weight:600">${p.name}</td>
      <td><span class="badge" style="background:var(--bg);color:var(--text-muted);border:1px solid var(--border)">${p.category}</span></td>
      <td style="font-weight:700">${fmtPrice(p.price)}</td>
      <td style="text-align:center">${p.featured ? '⭐' : '—'}</td>
      <td>${p.badge ? `<span class="badge badge-processing">${p.badge}</span>` : '—'}</td>
    </tr>
  `).join('');
}

// ============================================================
//  INIT
// ============================================================
function initAdmin() {
  initOrders();
  initMessages();
  initProducts();
}
