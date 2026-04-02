// ============================================================
//  Products DB — Firestore-backed product loader
//  Falls back to static data if Firestore is empty or fails.
// ============================================================

import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { PRODUCTS as STATIC } from './products-data.js';

let _cache = null;

export function invalidateCache() { _cache = null; }

async function loadProducts() {
  if (_cache) return _cache;
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (!snap.empty) {
      _cache = snap.docs
        .map(d => ({ ...d.data(), id: d.id }))
        .filter(p => p.active !== false)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      return _cache;
    }
  } catch (e) {
    console.warn('Firestore products unavailable, using static data:', e.message);
  }
  _cache = STATIC;
  return _cache;
}

export async function getAllProducts()              { return loadProducts(); }

export async function getProductById(id) {
  const list = await loadProducts();
  return list.find(p => String(p.id) === String(id)) ?? null;
}

export async function getProductsByCategory(cat) {
  const list = await loadProducts();
  if (!cat || cat === 'Todos') return list;
  return list.filter(p => p.category === cat);
}

export async function getFeaturedProducts() {
  const list = await loadProducts();
  return list.filter(p => p.featured);
}

export async function getAccessories() {
  const list = await loadProducts();
  return list.filter(p => p.category === 'Accesorios');
}

export async function getRelatedProducts(currentId, limit = 4) {
  const list = await loadProducts();
  const cur = list.find(p => String(p.id) === String(currentId));
  if (!cur) return list.slice(0, limit);
  return list
    .filter(p => String(p.id) !== String(currentId) && p.category === cur.category)
    .concat(list.filter(p => String(p.id) !== String(currentId) && p.category !== cur.category))
    .slice(0, limit);
}

export async function getCategories() {
  const list = await loadProducts();
  return ['Todos', ...new Set(list.map(p => p.category))];
}
