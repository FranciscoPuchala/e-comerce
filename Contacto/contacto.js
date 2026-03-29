// ============================================================
//  Contact Page Logic
//  Saves form submissions to Firebase Firestore
// ============================================================

import { updateCartBadge, showToast, initHeader } from '../js/cart-utils.js';
import { db } from '../js/firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

function setError(fieldId, msg) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + 'Error');
  if (input) input.classList.toggle('error', !!msg);
  if (error) error.textContent = msg;
}

function validateForm() {
  let valid = true;

  const name = document.getElementById('contactName')?.value.trim();
  const email = document.getElementById('contactEmail')?.value.trim();
  const subject = document.getElementById('contactSubject')?.value.trim();
  const message = document.getElementById('contactMessage')?.value.trim();

  if (!name) { setError('contactName', 'El nombre es requerido'); valid = false; }
  else setError('contactName', '');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('contactEmail', 'Ingresá un email válido'); valid = false;
  } else setError('contactEmail', '');

  if (!subject) { setError('contactSubject', 'El asunto es requerido'); valid = false; }
  else setError('contactSubject', '');

  if (!message || message.length < 10) {
    setError('contactMessage', 'El mensaje debe tener al menos 10 caracteres'); valid = false;
  } else setError('contactMessage', '');

  return valid;
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const subject = document.getElementById('contactSubject').value.trim();
  const message = document.getElementById('contactMessage').value.trim();

  try {
    await addDoc(collection(db, 'contacts'), {
      name,
      email,
      subject,
      message,
      createdAt: serverTimestamp(),
      read: false,
    });

    // Show success state
    document.getElementById('contactForm').style.display = 'none';
    document.getElementById('formSuccess').style.display = '';
    showToast('Mensaje enviado correctamente', 'success');
  } catch (err) {
    console.error('Error saving contact:', err);
    showToast('Error al enviar el mensaje. Intentá de nuevo.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar mensaje';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  updateCartBadge();

  const form = document.getElementById('contactForm');
  form?.addEventListener('submit', handleSubmit);

  document.getElementById('resetFormBtn')?.addEventListener('click', () => {
    form.reset();
    form.style.display = '';
    document.getElementById('formSuccess').style.display = 'none';
  });

  // Clear errors on input
  ['contactName', 'contactEmail', 'contactSubject', 'contactMessage'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => setError(id, ''));
  });
});
