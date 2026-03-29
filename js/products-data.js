// ============================================================
//  Product Catalog
//  Edit this file to add, remove, or update products.
//  Images: place files in /img/ or use full URLs.
// ============================================================

export const PRODUCTS = [
  {
    id: '1',
    name: 'iPhone 16 Pro Max',
    category: 'iPhone',
    price: 1299,
    description: 'Titanio. A18 Pro. El iPhone más avanzado jamás creado.',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80',
    badge: 'Nuevo',
    featured: true,
  },
  {
    id: '2',
    name: 'iPhone 16',
    category: 'iPhone',
    price: 999,
    description: 'Chip A18. Cámara de 48 MP. Diseñado para Apple Intelligence.',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80',
    badge: 'Nuevo',
    featured: true,
  },
  {
    id: '3',
    name: 'iPad Pro M4',
    category: 'iPad',
    price: 1099,
    description: 'Pantalla Ultra Retina XDR. Potenciado por el chip M4.',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80',
    badge: null,
    featured: true,
  },
  {
    id: '4',
    name: 'Apple Watch Ultra 2',
    category: 'Watch',
    price: 799,
    description: 'El reloj más poderoso de Apple. Para atletas de élite.',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80',
    badge: null,
    featured: false,
  },
  {
    id: '5',
    name: 'AirPods Pro 2',
    category: 'AirPods',
    price: 249,
    description: 'Audio Adaptivo. Transparencia Adaptativa. Cancela el ruido.',
    image: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600&q=80',
    badge: null,
    featured: false,
  },
  {
    id: '6',
    name: 'MacBook Air M3',
    category: 'Mac',
    price: 1099,
    description: 'El portátil más delgado y ligero de Apple. Chip M3.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
    badge: null,
    featured: true,
  },
  {
    id: '7',
    name: 'Funda de Silicona',
    category: 'Accesorios',
    price: 49,
    description: 'Para iPhone 16. Toque suave al tacto, resistente a la suciedad.',
    image: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=600&q=80',
    badge: null,
    featured: false,
  },
  {
    id: '8',
    name: 'Cargador MagSafe',
    category: 'Accesorios',
    price: 39,
    description: 'Carga inalámbrica de hasta 15 W. Conéctalo y listo.',
    image: 'https://images.unsplash.com/photo-1585338447937-7082f8fc763d?w=600&q=80',
    badge: null,
    featured: false,
  },
];

export const CATEGORIES = ['Todos', ...new Set(PRODUCTS.map(p => p.category))];

export function getProductById(id) {
  return PRODUCTS.find(p => p.id === String(id)) ?? null;
}

export function getProductsByCategory(category) {
  if (!category || category === 'Todos') return PRODUCTS;
  return PRODUCTS.filter(p => p.category === category);
}

export function getFeaturedProducts() {
  return PRODUCTS.filter(p => p.featured);
}

export function getAccessories() {
  return PRODUCTS.filter(p => p.category === 'Accesorios');
}
