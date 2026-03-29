// ============================================================
//  Checkout Page Logic
//  - Validates form
//  - Saves order to Firebase Firestore
//  - Calls Firebase Function to create MercadoPago preference
//  - Redirects to MercadoPago payment page
// ============================================================

import { Cart, updateCartBadge, showToast, initHeader, formatPrice } from '../js/cart-utils.js';
import { db } from '../js/firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ---- Entorno: detecta automáticamente si estás en GitHub Pages (demo) o Bluehost (producción) ----
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io');
const PAYMENT_ENDPOINT = IS_GITHUB_PAGES ? null : '/create_preference.php';

// ---- Render order summary ----
function renderSummary() {
  const items = Cart.get();
  const itemsEl = document.getElementById('checkoutItems');
  const subtotalEl = document.getElementById('checkoutSubtotal');
  const totalEl = document.getElementById('checkoutTotal');

  if (!itemsEl) return;

  itemsEl.innerHTML = items.map(item => `
    <div class="checkout-item">
      <img src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="checkout-item-info">
        <div class="checkout-item-name">${item.name}</div>
        <div class="checkout-item-qty">Cantidad: ${item.qty}</div>
      </div>
      <div class="checkout-item-price">${formatPrice(item.price * item.qty)}</div>
    </div>
  `).join('');

  const subtotal = Cart.subtotal();
  subtotalEl.textContent = formatPrice(subtotal);
  totalEl.textContent = formatPrice(subtotal);
}

// ---- Payment method toggle ----
function initPaymentToggle() {
  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-option').forEach(opt =>
        opt.classList.toggle('selected', opt.querySelector('input').checked));
    });
  });
}

// ---- Form validation ----
function getField(id) { return document.getElementById(id); }
function setError(fieldId, msg) {
  getField(fieldId).classList.toggle('error', !!msg);
  document.getElementById(fieldId + 'Error').textContent = msg;
}

function validateForm() {
  let valid = true;

  const fields = [
    { id: 'firstName', label: 'Nombre', required: true },
    { id: 'lastName', label: 'Apellido', required: true },
    { id: 'email', label: 'Email', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    { id: 'address', label: 'Dirección', required: true },
    { id: 'city', label: 'Ciudad', required: true },
  ];

  fields.forEach(({ id, label, required, pattern }) => {
    const val = getField(id)?.value.trim() ?? '';
    if (required && !val) {
      setError(id, `${label} es requerido`);
      valid = false;
    } else if (pattern && !pattern.test(val)) {
      setError(id, `${label} no es válido`);
      valid = false;
    } else {
      setError(id, '');
    }
  });

  return valid;
}

function getFormData() {
  return {
    firstName: getField('firstName').value.trim(),
    lastName: getField('lastName').value.trim(),
    email: getField('email').value.trim(),
    phone: getField('phone')?.value.trim() ?? '',
    address: getField('address').value.trim(),
    city: getField('city').value.trim(),
    zip: getField('zip')?.value.trim() ?? '',
  };
}

// ---- Save order to Firestore ----
async function saveOrderToFirestore(formData, paymentMethod) {
  const items = Cart.get();
  const total = Cart.subtotal();

  const order = {
    customer: formData,
    items: items.map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
      subtotal: i.price * i.qty,
    })),
    total,
    paymentMethod,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'orders'), order);
  return docRef.id;
}

// ---- Call PHP backend to create MercadoPago preference (solo en Bluehost) ----
async function createMercadoPagoPreference(orderId, formData) {
  const items = Cart.get();

  const response = await fetch(PAYMENT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      items: items.map(i => ({
        id: i.id,
        title: i.name,
        quantity: i.qty,
        unit_price: i.price,
      })),
      payer: {
        name: formData.firstName,
        surname: formData.lastName,
        email: formData.email,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? 'Error al crear preferencia de pago');
  }

  return response.json(); // { preferenceId, init_point }
}

// ---- Handle bank transfer ----
function handleBankTransfer(orderId) {
  showToast('Te enviaremos los datos bancarios por email.', 'success');
  const msg = document.getElementById('payStatus');
  msg.innerHTML = `
    <strong>Pedido #${orderId.slice(-8).toUpperCase()}</strong> registrado.<br>
    Recibirás los datos de transferencia en tu email.
    <br><br>
    <a href="../index.html" class="btn btn-ghost btn-sm" style="margin-top:8px">Volver al inicio</a>
  `;
  msg.style.color = 'var(--success)';
  Cart.clear();
  updateCartBadge();
}

// ---- Main pay handler ----
async function handlePay() {
  if (!validateForm()) {
    showToast('Completá los campos requeridos', 'error');
    return;
  }

  const items = Cart.get();
  if (items.length === 0) {
    showToast('Tu carrito está vacío', 'error');
    return;
  }

  const payBtn = document.getElementById('payBtn');
  const payStatus = document.getElementById('payStatus');
  const formData = getFormData();
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

  payBtn.disabled = true;
  payBtn.textContent = 'Procesando...';
  payStatus.textContent = '';

  try {
    // 1. Save order to Firestore
    const orderId = await saveOrderToFirestore(formData, paymentMethod);

    // 2. Payment flow
    if (paymentMethod === 'transfer') {
      handleBankTransfer(orderId);
    } else if (!PAYMENT_ENDPOINT) {
      // Modo demo (GitHub Pages) — sin backend real
      showToast('Pedido registrado. Pago simulado en modo demo.', 'success');
      payStatus.innerHTML = `
        <strong>✅ Pedido #${orderId.slice(-8).toUpperCase()} registrado</strong><br>
        <span style="color:var(--text-muted)">
          Este es un sitio demo. En producción se redirigirá a MercadoPago para completar el pago.
        </span><br><br>
        <a href="../index.html" class="btn btn-ghost btn-sm">Volver al inicio</a>
      `;
      Cart.clear();
      updateCartBadge();
      payBtn.style.display = 'none';
    } else {
      // MercadoPago flow (Bluehost producción)
      payStatus.textContent = 'Redirigiendo a MercadoPago...';
      const { init_point } = await createMercadoPagoPreference(orderId, formData);
      Cart.clear();
      window.location.href = init_point;
    }
  } catch (err) {
    console.error('Checkout error:', err);
    showToast(`Error: ${err.message}`, 'error');
    payStatus.textContent = 'Ocurrió un error. Por favor intentá de nuevo.';
    payStatus.style.color = 'var(--error)';
    payBtn.disabled = false;
    payBtn.textContent = 'Pagar ahora →';
  }
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  updateCartBadge();

  const items = Cart.get();

  if (items.length === 0) {
    document.getElementById('emptyNotice').style.display = '';
    document.getElementById('checkoutSection').style.display = 'none';
    return;
  }

  renderSummary();
  initPaymentToggle();

  document.getElementById('payBtn').addEventListener('click', handlePay);

  // Clear field errors on input
  ['firstName', 'lastName', 'email', 'address', 'city'].forEach(id => {
    getField(id)?.addEventListener('input', () => setError(id, ''));
  });
});
