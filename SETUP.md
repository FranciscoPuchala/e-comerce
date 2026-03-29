# iPlace — Guía de configuración

## 1. Firebase

### Crear el proyecto
1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Crear un proyecto nuevo
3. Activar **Firestore Database** (modo producción)
4. Activar **Hosting**
5. Ir a *Project settings → Your apps → Web app* → copiar el config

### Configurar credenciales
Abrir `js/firebase-config.js` y reemplazar los valores:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // etc
};
```

También reemplazar en `.firebaserc`:
```json
{ "projects": { "default": "tu-project-id" } }
```

---

## 2. MercadoPago

1. Crear cuenta en [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
2. Obtener el **Access Token** de producción (o de prueba para testing)
3. Guardar como secret de Firebase:
```bash
firebase functions:secrets:set MP_ACCESS_TOKEN
# Pegar el Access Token cuando lo pida
```

En `Checkout/checkout.js`, reemplazar la URL de la función:
```js
const FUNCTIONS_URL = 'https://us-central1-TU-PROYECTO.cloudfunctions.net';
```

En `functions/index.js`, reemplazar las URLs de retorno:
```js
back_urls: {
  success: 'https://tu-dominio.web.app/Checkout/success.html',
  failure: 'https://tu-dominio.web.app/Checkout/failure.html',
  pending: 'https://tu-dominio.web.app/Checkout/pending.html',
}
```

---

## 3. Instalar dependencias e iniciar

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Instalar dependencias de functions
cd functions
npm install
cd ..

# Correr en local (emuladores)
firebase emulators:start

# Desplegar todo
firebase deploy
```

---

## 4. Personalizar productos

Editar `js/products-data.js` para cambiar nombre, precio, imagen y descripción.
**Importante:** mantener sincronizado el `PRICE_LIST` en `functions/index.js` con los mismos precios.

---

## 5. Estructura de carpetas

```
e-comerce/
├── index.html            ← Inicio
├── css/main.css          ← Todos los estilos
├── js/
│   ├── firebase-config.js  ← Credenciales Firebase
│   ├── cart-utils.js       ← Utilidades del carrito
│   └── products-data.js    ← Catálogo de productos
├── Productos/            ← Página de productos
├── Carrito/              ← Carrito de compras
├── Checkout/             ← Finalizar compra + páginas de resultado
├── Contacto/             ← Formulario de contacto
├── functions/            ← Backend (Firebase Cloud Functions)
├── firebase.json         ← Config Firebase
├── firestore.rules       ← Reglas de seguridad Firestore
└── .firebaserc           ← Project ID
```

## Códigos de descuento disponibles
- `IPLACE10` → 10% off
- `BIENVENIDO` → 15% off
- `PREMIUM20` → 20% off
