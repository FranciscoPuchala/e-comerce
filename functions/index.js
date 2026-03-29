// ============================================================
//  Firebase Cloud Functions — iPlace
//  Handles MercadoPago preference creation securely
//
//  Setup:
//    1. cd functions && npm install
//    2. firebase functions:secrets:set MP_ACCESS_TOKEN
//       (paste your Mercado Pago Access Token when prompted)
//    3. firebase deploy --only functions
// ============================================================

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Stored securely — never in code or .env committed to git
const MP_ACCESS_TOKEN = defineSecret('MP_ACCESS_TOKEN');

// ---- Master price list (server-side validation) ----
// IMPORTANT: These prices must match what's shown to the user.
// Never trust prices sent from the client.
const PRICE_LIST = {
  '1': { name: 'iPhone 16 Pro Max',   price: 1299 },
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
