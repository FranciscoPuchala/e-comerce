// ============================================================
//  Firebase Cloud Functions — iPlace
//  Handles MercadoPago preference creation + email notifications
//
//  Setup:
//    1. cd functions && npm install
//    2. firebase functions:secrets:set MP_ACCESS_TOKEN
//    3. firebase functions:secrets:set MAIL_USER   (Gmail address)
//    4. firebase functions:secrets:set MAIL_PASS   (Gmail App Password)
//    5. firebase deploy --only functions
// ============================================================

const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const MP_ACCESS_TOKEN = defineSecret('MP_ACCESS_TOKEN');
const MAIL_USER = defineSecret('MAIL_USER');
const MAIL_PASS = defineSecret('MAIL_PASS');

const ADMIN_EMAIL = 'admin@iplace.com'; // Change to real admin email

// ---- Email helper ----
function createTransport(mailUser, mailPass) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: mailUser, pass: mailPass },
  });
}

function formatPriceARS(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
}

function buildOrderConfirmationEmail(order, orderId) {
  const displayId = `IPL-${orderId.slice(-8).toUpperCase()}`;
  const itemsHtml = (order.items ?? []).map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee">${item.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center">${item.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right">${formatPriceARS(item.subtotal ?? item.price * item.qty)}</td>
    </tr>`).join('');

  const paymentLabel = order.paymentMethod === 'transfer'
    ? 'Transferencia bancaria'
    : 'MercadoPago';

  const transferNote = order.paymentMethod === 'transfer' ? `
    <div style="background:#f0f9ff;border-left:4px solid #0a84ff;padding:16px;margin:24px 0;border-radius:4px">
      <strong>Datos para la transferencia:</strong><br>
      Banco: Banco Galicia &nbsp;·&nbsp; Titular: iPlace S.R.L.<br>
      CBU: 0070023820000000123456 &nbsp;·&nbsp; Alias: IPLACE.TIENDA<br>
      <small>Enviá el comprobante a pagos@iplace.com indicando tu número de pedido.</small>
    </div>` : '';

  return {
    subject: `Confirmación de pedido ${displayId} — iPlace`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
        <div style="background:#070710;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;font-size:1.5rem;margin:0">iPlace</h1>
          <p style="color:#8888aa;margin:4px 0 0">Tu distribuidor oficial Apple</p>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #eee;border-top:none">
          <h2 style="font-size:1.25rem;margin-bottom:8px">¡Pedido confirmado!</h2>
          <p style="color:#666">Hola <strong>${order.customer?.firstName ?? ''}</strong>, recibimos tu pedido correctamente.</p>

          <div style="background:#f5f5fa;border-radius:8px;padding:16px;margin:20px 0">
            <strong>N.° de pedido:</strong> ${displayId}<br>
            <strong>Método de pago:</strong> ${paymentLabel}
          </div>

          ${transferNote}

          <table width="100%" style="border-collapse:collapse;margin:20px 0">
            <thead>
              <tr style="font-size:.85rem;color:#999;text-transform:uppercase">
                <th style="text-align:left;padding-bottom:8px">Producto</th>
                <th style="text-align:center;padding-bottom:8px">Cant.</th>
                <th style="text-align:right;padding-bottom:8px">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="text-align:right;margin-top:16px">
            <strong style="font-size:1.1rem">Total: ${formatPriceARS(order.total)}</strong>
          </div>

          <div style="margin-top:24px;padding-top:24px;border-top:1px solid #eee">
            <strong>Dirección de entrega:</strong><br>
            ${order.customer?.address ?? ''}, ${order.customer?.city ?? ''} ${order.customer?.zip ?? ''}
          </div>

          <div style="margin-top:24px;text-align:center">
            <a href="https://iplace.com"
               style="display:inline-block;background:#0071e3;color:#fff;padding:12px 28px;border-radius:20px;text-decoration:none;font-weight:600">
              Ir a iPlace →
            </a>
          </div>
        </div>
        <div style="padding:16px 32px;background:#f5f5fa;border-radius:0 0 12px 12px;font-size:.8rem;color:#999;text-align:center">
          © 2025 iPlace · Si tenés dudas escribinos a soporte@iplace.com
        </div>
      </div>`,
  };
}

function buildAdminNotificationEmail(order, orderId) {
  const displayId = `IPL-${orderId.slice(-8).toUpperCase()}`;
  const itemsList = (order.items ?? []).map(i => `• ${i.name} x${i.qty} = ${formatPriceARS(i.subtotal ?? i.price * i.qty)}`).join('\n');
  return {
    subject: `[iPlace] Nuevo pedido ${displayId} — ${formatPriceARS(order.total)}`,
    text: `Nuevo pedido recibido!\n\nPedido: ${displayId}\nCliente: ${order.customer?.firstName} ${order.customer?.lastName}\nEmail: ${order.customer?.email}\nTeléfono: ${order.customer?.phone ?? '-'}\nDirección: ${order.customer?.address}, ${order.customer?.city}\nMétodo de pago: ${order.paymentMethod}\nTotal: ${formatPriceARS(order.total)}\n\nProductos:\n${itemsList}\n\nRevisar en el admin: https://iplace.com/Admin/`,
  };
}

// ---- Email triggers ----

/**
 * Fires when a new order is created in Firestore.
 * Sends confirmation to customer + notification to admin.
 */
exports.onOrderCreated = onDocumentCreated(
  { document: 'orders/{orderId}', secrets: [MAIL_USER, MAIL_PASS] },
  async (event) => {
    const order = event.data?.data();
    const orderId = event.params.orderId;
    if (!order || !order.customer?.email) return;

    const transporter = createTransport(MAIL_USER.value(), MAIL_PASS.value());
    const customerEmail = buildOrderConfirmationEmail(order, orderId);
    const adminEmail = buildAdminNotificationEmail(order, orderId);

    await Promise.all([
      transporter.sendMail({ from: `"iPlace" <${MAIL_USER.value()}>`, to: order.customer.email, ...customerEmail }),
      transporter.sendMail({ from: `"iPlace" <${MAIL_USER.value()}>`, to: ADMIN_EMAIL, ...adminEmail }),
    ]).catch(err => console.error('Email send error:', err));
  }
);

/**
 * Fires when an order status changes to 'shipped'.
 * Sends shipping notification to customer.
 */
exports.onOrderShipped = onDocumentUpdated(
  { document: 'orders/{orderId}', secrets: [MAIL_USER, MAIL_PASS] },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const orderId = event.params.orderId;

    if (!after || before?.status === after?.status) return;
    if (after.status !== 'shipped') return;
    if (!after.customer?.email) return;

    const displayId = `IPL-${orderId.slice(-8).toUpperCase()}`;
    const transporter = createTransport(MAIL_USER.value(), MAIL_PASS.value());

    await transporter.sendMail({
      from: `"iPlace" <${MAIL_USER.value()}>`,
      to: after.customer.email,
      subject: `Tu pedido ${displayId} está en camino 🚚`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a2e">
          <div style="background:#070710;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;font-size:1.5rem;margin:0">iPlace</h1>
          </div>
          <div style="padding:32px;background:#fff;border:1px solid #eee;border-top:none">
            <h2>¡Tu pedido está en camino! 🎉</h2>
            <p>Hola <strong>${after.customer.firstName ?? ''}</strong>, tu pedido <strong>${displayId}</strong> fue despachado y está en camino a tu domicilio.</p>
            <p style="color:#666">Tiempo estimado de entrega: <strong>24–48 hs hábiles</strong>.</p>
            <div style="margin-top:24px;text-align:center">
              <a href="https://iplace.com/Pedido/index.html?order=${orderId.slice(-8).toUpperCase()}"
                 style="display:inline-block;background:#0071e3;color:#fff;padding:12px 28px;border-radius:20px;text-decoration:none;font-weight:600">
                Seguir mi pedido →
              </a>
            </div>
          </div>
          <div style="padding:16px 32px;background:#f5f5fa;border-radius:0 0 12px 12px;font-size:.8rem;color:#999;text-align:center">
            © 2025 iPlace · soporte@iplace.com
          </div>
        </div>`,
    }).catch(err => console.error('Shipping email error:', err));
  }
);

// ---- Master price list (server-side validation) ----
// IMPORTANT: These prices must match what's shown to the user.
// Never trust prices sent from the client.
const PRICE_LIST = {
  '1': { name: 'iPhone 16 Pro Max',   price: 10 },
  '2': { name: 'iPhone 16',           price: 999  },
  '3': { name: 'iPad Pro M4',         price: 1099 },
  '4': { name: 'Apple Watch Ultra 2', price: 799  },
  '5': { name: 'AirPods Pro 2',       price: 249  },
  '6': { name: 'MacBook Air M3',      price: 1099 },
  '7': { name: 'Funda de Silicona',   price: 49   },
  '8': { name: 'Cargador MagSafe',    price: 39   },
};

/**
 * POST /createPreference
 * Body: { orderId, items: [{ id, title, quantity }], payer: { name, surname, email } }
 * Returns: { preferenceId, init_point }
 */
exports.createPreference = onRequest(
  { cors: true, secrets: [MP_ACCESS_TOKEN] },
  async (req, res) => {
    // Only accept POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { orderId, items, payer } = req.body ?? {};

    // Basic validation
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }
    if (!orderId || !payer?.email) {
      return res.status(400).json({ error: 'Missing orderId or payer email' });
    }

    // Validate and build items using server-side prices
    const validatedItems = [];
    for (const item of items) {
      const master = PRICE_LIST[String(item.id)];
      if (!master) {
        return res.status(400).json({ error: `Invalid product id: ${item.id}` });
      }
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1 || qty > 99) {
        return res.status(400).json({ error: `Invalid quantity for product ${item.id}` });
      }
      validatedItems.push({
        id: String(item.id),
        title: master.name,
        unit_price: master.price,
        quantity: qty,
        currency_id: 'ARS',
      });
    }

    try {
      const client = new MercadoPagoConfig({
        accessToken: MP_ACCESS_TOKEN.value(),
      });
      const preferenceApi = new Preference(client);

      const preference = await preferenceApi.create({
        body: {
          items: validatedItems,
          payer: {
            name: payer.name ?? '',
            surname: payer.surname ?? '',
            email: payer.email,
          },
          external_reference: orderId,
          back_urls: {
            // Replace with your real domain after deploying
            success: 'https://tu-dominio.com/Checkout/success.html',
            failure: 'https://tu-dominio.com/Checkout/failure.html',
            pending: 'https://tu-dominio.com/Checkout/pending.html',
          },
          auto_return: 'approved',
          statement_descriptor: 'iPlace',
        },
      });

      // Update order in Firestore with preference ID
      await db.collection('orders').doc(orderId).update({
        preferenceId: preference.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        preferenceId: preference.id,
        init_point: preference.init_point,
      });
    } catch (err) {
      console.error('MercadoPago error:', err);
      return res.status(500).json({ error: 'Failed to create payment preference' });
    }
  }
);

/**
 * POST /mpWebhook
 * MercadoPago sends payment notifications here.
 * Update order status in Firestore based on payment result.
 */
exports.mpWebhook = onRequest(
  { cors: false, secrets: [MP_ACCESS_TOKEN] },
  async (req, res) => {
    const { type, data } = req.body ?? {};

    if (type !== 'payment' || !data?.id) {
      return res.sendStatus(200); // Ignore non-payment events
    }

    try {
      const { MercadoPagoConfig, Payment } = require('mercadopago');
      const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN.value() });
      const paymentApi = new Payment(client);
      const payment = await paymentApi.get({ id: data.id });

      const orderId = payment.external_reference;
      const status = payment.status; // approved, rejected, pending...

      if (orderId) {
        await db.collection('orders').doc(orderId).update({
          status,
          paymentId: String(data.id),
          paymentStatus: payment.status_detail,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error('Webhook error:', err);
      return res.sendStatus(500);
    }
  }
);

/**
 * When an order status changes to 'paid' or 'approved',
 * decrement stock for each product in Firestore.
 */
exports.onOrderPaid = onDocumentUpdated(
  { document: 'orders/{orderId}' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!after) return;

    const wasPaid = ['paid', 'approved'].includes(before?.status);
    const isPaid  = ['paid', 'approved'].includes(after?.status);

    // Only react when transitioning into paid/approved
    if (wasPaid || !isPaid) return;

    const items = after.items ?? [];
    if (items.length === 0) return;

    const batch = db.batch();
    for (const item of items) {
      const productRef = db.collection('products').doc(String(item.id));
      const productSnap = await productRef.get();
      if (!productSnap.exists) continue;

      const currentStock = productSnap.data().stock ?? 0;
      const newStock = Math.max(0, currentStock - (item.qty ?? 1));
      batch.update(productRef, {
        stock: newStock,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit().catch(err => console.error('Stock update error:', err));
  }
);
