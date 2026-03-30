// ============================================================
//  Product Catalog
// ============================================================

export const PRODUCTS = [
  {
    id: '1',
    name: 'iPhone 16 Pro Max',
    category: 'iPhone',
    price: 10,
    description: 'El iPhone más avanzado jamás creado. Cuerpo de titanio grado 5, el mismo que se usa en naves espaciales. Chip A18 Pro con Neural Engine de última generación para Apple Intelligence.',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
    badge: 'Nuevo',
    featured: true,
    features: [
      { icon: '⚡', label: 'Chip', value: 'A18 Pro — 6 núcleos de CPU' },
      { icon: '📸', label: 'Cámara', value: 'Sistema Pro 48 MP + Telemacro' },
      { icon: '🔋', label: 'Batería', value: 'Hasta 33 hs de video' },
      { icon: '📱', label: 'Pantalla', value: 'Super Retina XDR 6.9"' },
      { icon: '🛡️', label: 'Resistencia', value: 'IP68 — 6 m de profundidad' },
      { icon: '💾', label: 'Almacenamiento', value: 'Desde 256 GB hasta 1 TB' },
    ],
  },
  {
    id: '2',
    name: 'iPhone 16',
    category: 'iPhone',
    price: 999,
    description: 'Diseñado para Apple Intelligence. Chip A18 con Neural Engine de nueva generación. Cámara Fusion de 48 MP. El iPhone más popular, ahora más potente que nunca.',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
    badge: 'Nuevo',
    featured: true,
    features: [
      { icon: '⚡', label: 'Chip', value: 'A18 — Neural Engine' },
      { icon: '📸', label: 'Cámara', value: 'Fusion 48 MP + Ultra gran angular' },
      { icon: '🔋', label: 'Batería', value: 'Hasta 27 hs de video' },
      { icon: '📱', label: 'Pantalla', value: 'Super Retina XDR 6.1"' },
      { icon: '🛡️', label: 'Resistencia', value: 'IP68 — 6 m de profundidad' },
      { icon: '💾', label: 'Almacenamiento', value: 'Desde 128 GB hasta 512 GB' },
    ],
  },
  {
    id: '3',
    name: 'iPad Pro M4',
    category: 'iPad',
    price: 1099,
    description: 'La tableta más potente del mundo. Chip M4 con rendimiento de portátil. Pantalla Ultra Retina XDR con nano-textura opcional. Tan delgado que parece imposible.',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    badge: null,
    featured: true,
    features: [
      { icon: '⚡', label: 'Chip', value: 'Apple M4 — 10 núcleos' },
      { icon: '📱', label: 'Pantalla', value: 'Ultra Retina XDR OLED 11" o 13"' },
      { icon: '🔋', label: 'Batería', value: 'Hasta 10 hs de uso activo' },
      { icon: '📸', label: 'Cámara', value: '12 MP gran angular + LiDAR' },
      { icon: '🔌', label: 'Conectividad', value: 'Thunderbolt / USB 4' },
      { icon: '💾', label: 'Almacenamiento', value: 'Desde 256 GB hasta 2 TB' },
    ],
  },
  {
    id: '4',
    name: 'Apple Watch Ultra 2',
    category: 'Watch',
    price: 799,
    description: 'El reloj más capaz que Apple ha diseñado. Para los atletas más exigentes del mundo. Titanio aeroespacial, GPS de doble frecuencia y profundidad de 100 metros.',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
    badge: null,
    featured: false,
    features: [
      { icon: '⚡', label: 'Chip', value: 'S9 SiP — doble núcleo' },
      { icon: '📱', label: 'Pantalla', value: 'LTPO OLED 49 mm, 3000 nits' },
      { icon: '🔋', label: 'Batería', value: 'Hasta 60 hs en modo bajo consumo' },
      { icon: '🌊', label: 'Resistencia', value: 'WR100 — 100 m de profundidad' },
      { icon: '📡', label: 'GPS', value: 'Doble frecuencia L1 + L5' },
      { icon: '🛡️', label: 'Carcasa', value: 'Titanio aeroespacial' },
    ],
  },
  {
    id: '5',
    name: 'AirPods Pro 2',
    category: 'AirPods',
    price: 249,
    description: 'Audio Adaptivo. El chip H2 ofrece cancelación de ruido activa 2 veces más potente. Transparencia Adaptativa que escucha y ajusta el audio de tu entorno en tiempo real.',
    image: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800&q=80',
    badge: null,
    featured: false,
    features: [
      { icon: '⚡', label: 'Chip', value: 'H2 de Apple' },
      { icon: '🔇', label: 'Cancelación', value: 'ANC activa 2× más potente' },
      { icon: '🔋', label: 'Batería', value: 'Hasta 30 hs totales (con estuche)' },
      { icon: '🌊', label: 'Resistencia', value: 'IP54 — resistente al sudor' },
      { icon: '🎵', label: 'Audio', value: 'Spatial Audio + Audio adaptativo' },
      { icon: '🔌', label: 'Carga', value: 'MagSafe / Lightning / Qi' },
    ],
  },
  {
    id: '6',
    name: 'MacBook Air M3',
    category: 'Mac',
    price: 1099,
    description: 'El portátil más delgado y ligero de Apple. El chip M3 lo hace increíblemente rápido y silencioso — sin ventilador. Pantalla Liquid Retina de 13.6" o 15.3".',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    badge: null,
    featured: true,
    features: [
      { icon: '⚡', label: 'Chip', value: 'Apple M3 — 8 núcleos CPU / 10 GPU' },
      { icon: '📱', label: 'Pantalla', value: 'Liquid Retina 13.6" o 15.3"' },
      { icon: '🔋', label: 'Batería', value: 'Hasta 18 hs de autonomía' },
      { icon: '💾', label: 'RAM', value: '8 GB / 16 GB / 24 GB unificada' },
      { icon: '🔌', label: 'Puertos', value: 'MagSafe 3 + 2× Thunderbolt 3' },
      { icon: '⚖️', label: 'Peso', value: 'Solo 1.24 kg' },
    ],
  },
  {
    id: '7',
    name: 'Funda de Silicona',
    category: 'Accesorios',
    price: 49,
    description: 'Funda oficial Apple para iPhone 16. Silicona suave al tacto, resistente a la suciedad. Interior de microfibra que protege el acabado de tu iPhone.',
    image: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=800&q=80',
    badge: null,
    featured: false,
    features: [
      { icon: '🎨', label: 'Material', value: 'Silicona premium' },
      { icon: '📱', label: 'Compatible', value: 'iPhone 16 / 16 Plus / 16 Pro / Max' },
      { icon: '🛡️', label: 'Protección', value: 'Bordes elevados pantalla y cámara' },
      { icon: '🧲', label: 'MagSafe', value: 'Compatible con MagSafe' },
    ],
  },
  {
    id: '8',
    name: 'Cargador MagSafe',
    category: 'Accesorios',
    price: 39,
    description: 'Carga inalámbrica de hasta 15 W para iPhone. Se conecta magnéticamente. También carga Apple Watch y AirPods. Cable USB-C de 1 metro incluido.',
    image: 'https://images.unsplash.com/photo-1585338447937-7082f8fc763d?w=800&q=80',
    badge: null,
    featured: false,
    features: [
      { icon: '⚡', label: 'Potencia', value: 'Hasta 15 W con iPhone 12 o superior' },
      { icon: '🧲', label: 'Conexión', value: 'Magnética — se alinea solo' },
      { icon: '📱', label: 'Compatible', value: 'iPhone 12 o posterior' },
      { icon: '🔌', label: 'Cable', value: 'USB-C de 1 metro incluido' },
    ],
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

export function getRelatedProducts(currentId, limit = 4) {
  const current = getProductById(currentId);
  if (!current) return PRODUCTS.slice(0, limit);
  return PRODUCTS
    .filter(p => p.id !== String(currentId) && p.category === current.category)
    .concat(PRODUCTS.filter(p => p.id !== String(currentId) && p.category !== current.category))
    .slice(0, limit);
}
