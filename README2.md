# Checklist — Datos a solicitar al cliente

Todo lo que hay que pedirle al cliente para adaptar el código a su negocio.

---

## 1. IDENTIDAD / MARCA

- [ ] **Nombre de la tienda** — reemplaza "iPlace" en todo el sitio
- [ ] **Slogan o descripción corta** — aparece en header, hero y footer
- [ ] **Logo** — imagen o solo texto (fuente, color)
- [ ] **Color principal** — reemplaza el azul `#0071e3`
- [ ] **Color secundario** — reemplaza el violeta `#5e5ce6`
- [ ] **Favicon** — ícono que aparece en la pestaña del navegador

---

## 2. PRODUCTOS

Por cada producto necesitás:

- [ ] **Nombre del producto**
- [ ] **Categoría** (ej: iPhone, Mac, Accesorios, etc.)
- [ ] **Precio** (en ARS o la moneda que use)
- [ ] **Descripción corta** (1-2 oraciones para la card)
- [ ] **Descripción larga** (para la página de detalle)
- [ ] **Imagen** — URL o archivo (mínimo 800x800px, fondo blanco preferible)
- [ ] **Badge** — si tiene etiqueta como "Nuevo", "Oferta", etc.
- [ ] **Especificaciones técnicas** — para la tabla de características (ícono, nombre, valor)
- [ ] **¿Es producto destacado?** — para mostrarlo en la home

> ⚠️ Los precios también van en `create_preference.php` (servidor). Hay que actualizar ambos lugares.

---

## 3. MERCADOPAGO

- [ ] **Access Token de producción** — `APP_USR-...` desde developers.mercadopago.com → Credenciales → Producción
- [ ] **Public Key de producción** — si se implementa pago con tarjeta directo (no Checkout Pro)
- [ ] **Moneda** — ARS por defecto, cambiar si es otro país
- [ ] **Nombre del vendedor** — aparece en el resumen de pago (`statement_descriptor`)

---

## 4. DOMINIO Y HOSTING

- [ ] **Dominio** — ej: `https://mitienda.com` (reemplaza `https://layoutprueba.com` en `create_preference.php`)
- [ ] **URLs de retorno** — confirmar las rutas:
  - Pago aprobado: `/Checkout/success.html`
  - Pago rechazado: `/Checkout/failure.html`
  - Pago pendiente: `/Checkout/pending.html`
- [ ] **Hosting** — datos de acceso al File Manager o FTP para subir archivos

---

## 5. FIREBASE

- [ ] **Proyecto Firebase nuevo** — o compartir acceso al existente
- [ ] **Credenciales** — el objeto `firebaseConfig` completo:
  - `apiKey`
  - `authDomain`
  - `projectId`
  - `storageBucket`
  - `messagingSenderId`
  - `appId`

> Se cambia en `js/firebase-config.js`

---

## 6. CONTENIDO DE LA TIENDA

- [ ] **Texto del announcement bar** — la barra superior (ej: "Envío gratis en compras mayores a $X")
- [ ] **Texto del hero** — título principal y subtítulo de la home
- [ ] **Estadísticas** — los 4 números de la sección de stats (productos vendidos, calificación, etc.)
- [ ] **Testimonios** — nombre, ciudad y texto de 3 clientes reales (o inventados)
- [ ] **Códigos de descuento** — si quiere ofrecer promos (reemplaza IPLACE10, BIENVENIDO, PREMIUM20 en `cart-utils.js`)
- [ ] **Texto del footer** — descripción de la empresa

---

## 7. INFORMACIÓN DE CONTACTO

- [ ] **Email de contacto**
- [ ] **Teléfono / WhatsApp**
- [ ] **Dirección física** (si tiene local)
- [ ] **Horario de atención**
- [ ] **Redes sociales** — Instagram, Facebook, Twitter/X, WhatsApp (URLs completas)

---

## 8. SEO / META

- [ ] **Título de la página** — ej: "MiTienda — Distribuidor oficial Apple"
- [ ] **Descripción meta** — 1-2 oraciones para Google
- [ ] **Ciudad/País** — para el footer y texto general

---

## ARCHIVOS QUE HAY QUE MODIFICAR

| Dato | Archivo |
|------|---------|
| Productos y precios | `js/products-data.js` |
| Precios del servidor | `create_preference.php` |
| Token MercadoPago | `create_preference.php` |
| Dominio | `create_preference.php` |
| Firebase config | `js/firebase-config.js` |
| Códigos de descuento | `js/cart-utils.js` |
| Colores y fuentes | `css/main.css` (tokens al inicio) |
| Contenido HTML | `index.html` y sub-páginas |

---

> **Tiempo estimado de adaptación:** 2-4 horas una vez que el cliente entrega todos los datos.
