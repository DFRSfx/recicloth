import express from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';
import crypto from 'crypto';
import pool from '../config/database.js';
import emailService from '../emailService.js';
import { calculateShipping } from '../utils/shippingCalculator.js';
import { BUSINESS_RULES } from '../config/businessRules.js';
import { generateInvoicePdf } from '../utils/generateInvoicePdf.js';

const router = express.Router();

const stripeApiKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeApiKey ? new Stripe(stripeApiKey) : null;

const requireStripe = () => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in backend/.env');
  }
  return stripe;
};

const normalizePaymentMethod = (method?: string | null): string | null => {
  if (!method) return null;
  switch (method) {
    case 'mb_way':
      return 'mbway';
    case 'multibanco':
      return 'multibanco';
    case 'card':
      return 'card';
    case 'stripe':
      return 'stripe';
    default:
      return method;
  }
};

const extractPaymentMethodType = (pi: Stripe.PaymentIntent): string | null => {
  let methodType: string | undefined;
  if (pi.payment_method && typeof pi.payment_method !== 'string') {
    methodType = pi.payment_method.type;
  }
  if (!methodType) {
    const latestCharge = pi.latest_charge && typeof pi.latest_charge !== 'string' ? pi.latest_charge : null;
    methodType = latestCharge?.payment_method_details?.type;
  }
  if (!methodType && (pi as any).charges?.data?.length) {
    methodType = (pi as any).charges.data[0]?.payment_method_details?.type;
  }
  if (!methodType && Array.isArray(pi.payment_method_types) && pi.payment_method_types.length === 1) {
    methodType = pi.payment_method_types[0];
  }
  return normalizePaymentMethod(methodType);
};

const resolvePaymentMethod = async (paymentIntentId: string): Promise<string | null> => {
  if (!stripe) return null;
  try {
    const pi = await requireStripe().paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method', 'latest_charge'],
    });
    return extractPaymentMethodType(pi);
  } catch (error: any) {
    console.error(`Error resolving payment method for PI ${paymentIntentId}:`, error.message || error);
    return null;
  }
};

// Payment callback base URL — used as return_url for Multibanco / MB WAY.
const PAYMENT_CALLBACK_URL = (
  process.env.PAYMENT_CALLBACK_URL ||
  process.env.FRONTEND_URL?.split(',').find(u => u.startsWith('https://')) ||
  process.env.FRONTEND_URL?.split(',')[0] ||
  'http://localhost:5173'
).replace(/\/$/, '');

if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_...') {
  console.error('⚠️  STRIPE_SECRET_KEY not configured!');
} else {
  console.log('✅ Stripe configured with key:', process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...');
}

// ---------------------------------------------------------------------------
// Helper: create order from pending checkout data (used by /finalize + webhook)
// ---------------------------------------------------------------------------
async function createOrderFromData(
  connection: any,
  paymentIntentId: string,
  data: any
): Promise<{ orderId: number; trackingToken: string; order: any }> {
  const {
    customer_name, customer_email, customer_phone,
    customer_address, customer_city, customer_postal_code,
    billing_name, billing_address, billing_city, billing_postal_code,
    payment_method, items, user_id, save_address,
    delivery_country, shipping_cost: storedShippingCost,
  } = data;

  // Calculate shipping from stored data if not pre-computed
  const normalizedCountry = delivery_country ? String(delivery_country).toUpperCase() : 'PT';
  const itemCount = items.reduce((s: number, i: any) => s + Number(i.quantity), 0);
  const itemsTotal: number = items.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);
  const subtotal = Number((itemsTotal / (1 + BUSINESS_RULES.VAT_RATE)).toFixed(2));
  const shippingCost = storedShippingCost !== undefined
    ? Number(storedShippingCost)
    : calculateShipping(normalizedCountry, itemCount, subtotal).cost;
  const vatAmount = Number((itemsTotal - subtotal).toFixed(2));
  const total = Number((itemsTotal + shippingCost).toFixed(2));
  const resolvedMethod = payment_method === 'stripe'
    ? await resolvePaymentMethod(paymentIntentId)
    : null;
  const finalPaymentMethod = resolvedMethod || payment_method;

  const trackingToken = crypto.randomBytes(32).toString('hex');

  const [orderResult]: any = await connection.query(
    `INSERT INTO orders (
      tracking_token, user_id, customer_name, customer_email, customer_phone,
      customer_address, customer_city, customer_postal_code,
      billing_name, billing_address, billing_city, billing_postal_code,
      delivery_country, subtotal, vat_amount, shipping_cost,
      payment_method, total, status, payment_status, payment_intent_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trackingToken, user_id || null, customer_name, customer_email, customer_phone,
      customer_address, customer_city, customer_postal_code,
      billing_name || null, billing_address || null, billing_city || null, billing_postal_code || null,
      normalizedCountry, subtotal, vatAmount, shippingCost,
      finalPaymentMethod, total, 'pending', 'pending', paymentIntentId
    ]
  );
  const orderId = orderResult.insertId;

  for (const item of items) {
    await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price, color, size) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, item.product_id, item.quantity, item.price, item.color || null, item.size || null]
    );
    await connection.query(
      'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
      [item.quantity, item.product_id]
    );
  }

  if (user_id && save_address) {
    const [existing]: any = await connection.query(
      'SELECT id FROM shipping_addresses WHERE user_id = ? AND address = ? AND city = ? AND postal_code = ?',
      [user_id, customer_address, customer_city, customer_postal_code]
    );
    if (existing.length === 0) {
      const [countRows]: any = await connection.query(
        'SELECT COUNT(*) as count FROM shipping_addresses WHERE user_id = ?',
        [user_id]
      );
      await connection.query(
        'INSERT INTO shipping_addresses (user_id, name, address, city, postal_code, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, 'Morada Principal', customer_address, customer_city, customer_postal_code, customer_phone, countRows[0].count === 0 ? 1 : 0]
      );
    }
  }

  await connection.query(
    'DELETE FROM pending_checkouts WHERE payment_intent_id = ?',
    [paymentIntentId]
  );

  const [newOrder]: any = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  return { orderId, trackingToken, order: newOrder[0] };
}

// ---------------------------------------------------------------------------
// POST /api/payment/create-intent
// Lightweight: only needs items. Address is collected later at /finalize.
// ---------------------------------------------------------------------------
router.post(
  '/create-intent',
  [
    body('items').isArray({ min: 1 }).withMessage('Items are required'),
    body('items.*.product_id').isInt().withMessage('Product ID must be an integer'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { items, user_id } = req.body;
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const total = parseFloat(subtotal.toFixed(2));

      if (total <= 0) {
        res.status(400).json({ error: 'Invalid order total' });
        return;
      }

      const paymentIntent = await requireStripe().paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
      });

      await pool.execute(
        'INSERT INTO pending_checkouts (payment_intent_id, data) VALUES (?, ?)',
        [paymentIntent.id, JSON.stringify({ items, total, user_id: user_id || null, payment_method: 'stripe' })]
      );

      res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, amount: total });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: error.message || 'Failed to create payment intent' });
    }
  }
);

// ---------------------------------------------------------------------------
// PATCH /api/payment/intent/:id/amount
// Updates Stripe intent amount to include shipping for the selected country.
// Recalculates from stored pending_checkouts items — not user-supplied amounts.
// ---------------------------------------------------------------------------
router.patch('/intent/:id/amount', async (req: any, res: any) => {
  try {
    const { country } = req.body;
    if (!country) {
      res.status(400).json({ error: 'country is required' });
      return;
    }

    const [rows]: any = await pool.query(
      'SELECT data FROM pending_checkouts WHERE payment_intent_id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'Payment intent not found' });
      return;
    }

    const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
    const subtotal: number = data.items.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);
    const itemCount: number = data.items.reduce((s: number, i: any) => s + Number(i.quantity), 0);
    const shipping = calculateShipping(country, itemCount, subtotal);
    const newTotal = parseFloat((subtotal + shipping.cost).toFixed(2));

    await requireStripe().paymentIntents.update(req.params.id, {
      amount: Math.round(newTotal * 100),
    });

    // Persist country + shipping in pending data so finalize can save them
    await pool.execute(
      'UPDATE pending_checkouts SET data = ? WHERE payment_intent_id = ?',
      [JSON.stringify({ ...data, delivery_country: country.toUpperCase(), shipping_cost: shipping.cost }), req.params.id]
    );

    res.json({ amount: newTotal, shippingCost: shipping.cost });
  } catch (error: any) {
    console.error('Error updating intent amount:', error);
    res.status(500).json({ error: error.message || 'Failed to update amount' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/payment/initialize
// Creates a PaymentIntent and stores checkout data — NO order is created yet.
// ---------------------------------------------------------------------------
router.post(
  '/initialize',
  [
    body('customer_name').trim().notEmpty().withMessage('Name is required'),
    body('customer_email').isEmail().withMessage('Valid email is required'),
    body('customer_phone').trim().notEmpty().withMessage('Phone is required'),
    body('customer_address').trim().notEmpty().withMessage('Address is required'),
    body('customer_city').trim().notEmpty().withMessage('City is required'),
    body('customer_postal_code').trim().notEmpty().withMessage('Postal code is required'),
    body('items').isArray({ min: 1 }).withMessage('Items are required'),
    body('items.*.product_id').isInt().withMessage('Product ID must be an integer'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        customer_name, customer_email, customer_phone,
        customer_address, customer_city, customer_postal_code,
        items, user_id, save_address
      } = req.body;

      // item.price already includes IVA — no multiplication needed
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const total = parseFloat(subtotal.toFixed(2));

      if (total <= 0) {
        res.status(400).json({ error: 'Invalid order total' });
        return;
      }

      const paymentIntent = await requireStripe().paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
      });

      await pool.execute(
        'INSERT INTO pending_checkouts (payment_intent_id, data) VALUES (?, ?)',
        [
          paymentIntent.id,
          JSON.stringify({
            customer_name, customer_email, customer_phone,
            customer_address, customer_city, customer_postal_code,
            payment_method: 'stripe', items, total,
            user_id: user_id || null,
            save_address: save_address || false
          })
        ]
      );

      console.log(`💳 PI ${paymentIntent.id} created for ${customer_email} — ${total}€`);

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: total
      });
    } catch (error: any) {
      console.error('Error initializing payment:', error);
      res.status(500).json({ error: error.message || 'Failed to initialize payment' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/payment/finalize
// Called by frontend after payment succeeds — creates the order from pending data.
// ---------------------------------------------------------------------------
router.post(
  '/finalize',
  [body('payment_intent_id').trim().notEmpty().withMessage('Payment intent ID required')],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { payment_intent_id } = req.body;

      // Idempotency: return existing order if already finalized
      const [existing]: any = await pool.query(
        'SELECT * FROM orders WHERE payment_intent_id = ?',
        [payment_intent_id]
      );
      if (existing.length > 0) {
        res.json({ ...existing[0], tracking_url: `/track-order/${existing[0].tracking_token}` });
        return;
      }

      const [pendingRows]: any = await pool.query(
        'SELECT data FROM pending_checkouts WHERE payment_intent_id = ?',
        [payment_intent_id]
      );
      if (pendingRows.length === 0) {
        res.status(404).json({ error: 'Checkout session not found or already used' });
        return;
      }

      const raw = pendingRows[0].data;
      const pendingData = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // Merge address fields from request body (new flow) with stored data (old flow)
      const { customer_name, customer_email, customer_phone,
              customer_address, customer_city, customer_postal_code,
              delivery_country,
              billing_name, billing_address, billing_city, billing_postal_code,
              user_id, save_address } = req.body;
      const checkoutData = {
        ...pendingData,
        ...(customer_name && { customer_name, customer_email, customer_phone,
          customer_address, customer_city, customer_postal_code,
          billing_name: billing_name || null,
          billing_address: billing_address || null,
          billing_city: billing_city || null,
          billing_postal_code: billing_postal_code || null,
          user_id: user_id || pendingData.user_id || null,
          save_address: save_address || false }),
        // delivery_country from request overrides stored value (allows correction if PATCH wasn't called)
        ...(delivery_country && { delivery_country: String(delivery_country).toUpperCase() }),
      };
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();
        const { orderId, trackingToken, order } = await createOrderFromData(connection, payment_intent_id, checkoutData);
        await connection.commit();

        console.log(`✅ Order ${orderId} created for PI ${payment_intent_id}`);

        // If PI already succeeded (card payments), update order status and send email.
        // Card payments: Stripe fires the webhook BEFORE the frontend calls /finalize,
        // so the webhook finds no order and skips the email. We must send it here instead.
        try {
          const pi = await requireStripe().paymentIntents.retrieve(payment_intent_id);
          if (pi.status === 'succeeded') {
            await pool.execute(
              "UPDATE orders SET status = 'processing', payment_status = 'paid' WHERE id = ?",
              [orderId]
            );

            // Fetch full order + items to send confirmation email
            const [orderRows]: any = await pool.query(
              `SELECT customer_name, customer_email, customer_phone, total, subtotal, vat_amount, shipping_cost,
                      created_at, customer_address, customer_city, customer_postal_code,
                      payment_method, tracking_token
               FROM orders WHERE id = ?`, [orderId]
            );
            const [itemRows]: any = await pool.query(
              `SELECT oi.quantity, oi.price, oi.color, oi.size, p.name,
                      JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) AS first_image
               FROM order_items oi JOIN products p ON oi.product_id = p.id
               WHERE oi.order_id = ?`, [orderId]
            );
            if (orderRows.length > 0) {
              const o = orderRows[0];
              const orderDetailsForEmail = {
                total: parseFloat(o.total),
                subtotal: parseFloat(o.subtotal || o.total),
                shipping_cost: parseFloat(o.shipping_cost || 0),
                vat_amount: parseFloat(o.vat_amount || 0),
                created_at: o.created_at,
                customer_address: o.customer_address,
                customer_city: o.customer_city,
                customer_postal_code: o.customer_postal_code,
                payment_method: o.payment_method,
                tracking_token: o.tracking_token,
                items: itemRows.map((r: any) => ({
                  name: r.name, quantity: r.quantity, price: parseFloat(r.price),
                  color: r.color || undefined, size: r.size || undefined,
                  image: r.first_image || undefined,
                })),
              };
              // Send email — PDF is optional; don't let PDF failure block the email
              (async () => {
                let pdfBuffer: Buffer | undefined;
                try {
                  pdfBuffer = await generateInvoicePdf({
                    id: orderId,
                    payment_status: 'paid',
                    customer_name: o.customer_name,
                    customer_email: o.customer_email,
                    customer_phone: o.customer_phone || '',
                    ...orderDetailsForEmail,
                  });
                } catch (pdfErr: any) {
                  console.error('❌ Finalize PDF error (email will send without attachment):', pdfErr.message);
                }
                try {
                  await emailService.sendOrderConfirmation(
                    o.customer_email, o.customer_name, String(orderId),
                    orderDetailsForEmail, 'pt', pdfBuffer
                  );
                } catch (mailErr: any) {
                  console.error('❌ Finalize email error:', mailErr.message);
                }
              })();
            }
          }
        } catch (piErr: any) {
          console.error('Warning: could not check PI status:', piErr.message);
        }

        res.status(201).json({ ...order, tracking_url: `/track-order/${trackingToken}` });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error: any) {
      console.error('Error finalizing order:', error);
      res.status(500).json({ error: error.message || 'Failed to create order' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/payment/creditcard
// POST /api/payment/googlepay
// POST /api/payment/applepay
// All three create a PaymentIntent and return clientSecret for Stripe Elements
// ---------------------------------------------------------------------------
const cardPaymentHandler = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('order_id').isInt().withMessage('Order ID is required'),
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { amount, order_id } = req.body;

      console.log('Creating Stripe PaymentIntent for order:', order_id);

      const paymentIntent = await requireStripe().paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'eur',
        payment_method_types: ['card'],
        metadata: { order_id: String(order_id) }
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Stripe PaymentIntent error:', error);
      res.status(500).json({ error: error.message || 'Failed to create payment' });
    }
  }
];

router.post('/creditcard', cardPaymentHandler);
router.post('/googlepay', cardPaymentHandler);
router.post('/applepay', cardPaymentHandler);

// ---------------------------------------------------------------------------
// POST /api/payment/multibanco
// Creates a PaymentIntent and returns clientSecret for Stripe Elements.
// After frontend confirmation, Stripe returns entity/reference via next_action.
// ---------------------------------------------------------------------------
router.post(
  '/multibanco',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('order_id').isInt().withMessage('Order ID is required')
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { amount, order_id } = req.body;

      console.log('Creating Multibanco PaymentIntent for order:', order_id);

      const paymentIntent = await requireStripe().paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'eur',
        payment_method_types: ['multibanco'],
        metadata: { order_id: String(order_id) }
      } as any);

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Stripe Multibanco error:', error);
      res.status(500).json({ error: error.message || 'Erro Multibanco' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/payment/mbway
// Creates a PaymentIntent and returns clientSecret for Stripe Elements.
// The user enters their phone number in the Stripe MB WAY element frontend.
// ---------------------------------------------------------------------------
router.post(
  '/mbway',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('order_id').isInt().withMessage('Order ID is required')
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { amount, order_id } = req.body;

      console.log('Creating MB WAY PaymentIntent for order:', order_id);

      const paymentIntent = await requireStripe().paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'eur',
        payment_method_types: ['mb_way'],
        metadata: { order_id: String(order_id) }
      } as any);

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Stripe MB WAY error:', error);
      res.status(500).json({ error: error.message || 'Erro MB WAY' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/payment/webhook
// Stripe webhook — raw body required (set in index.ts before express.json())
// ---------------------------------------------------------------------------
router.post('/webhook', async (req: any, res: any) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret && webhookSecret !== 'whsec_...') {
    try {
      event = requireStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Stripe webhook signature verification failed:', err.message);
      res.status(400).json({ error: `Webhook error: ${err.message}` });
      return;
    }
  } else {
    // No webhook secret configured — parse body without verification (dev only)
    console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    try {
      event = JSON.parse(req.body.toString()) as Stripe.Event;
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
  }

  console.log('Stripe webhook received:', event.type);

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;

      // Find order: new flow uses payment_intent_id column; legacy uses metadata
      let orderId: number | null = null;
      const [byPI]: any = await pool.query(
        'SELECT id FROM orders WHERE payment_intent_id = ?', [pi.id]
      );
      if (byPI.length > 0) {
        orderId = byPI[0].id;
      } else if (pi.metadata?.order_id && !isNaN(parseInt(pi.metadata.order_id))) {
        orderId = parseInt(pi.metadata.order_id);
      }

      if (orderId) {
        const resolvedMethod = extractPaymentMethodType(pi);
        if (resolvedMethod) {
          await pool.execute(
            "UPDATE orders SET payment_method = ? WHERE id = ? AND (payment_method IS NULL OR payment_method = 'stripe')",
            [resolvedMethod, orderId]
          );
        }
        const [updateResult]: any = await pool.execute(
          "UPDATE orders SET status = 'processing', payment_status = 'paid' WHERE id = ? AND status = 'pending'",
          [orderId]
        );
        if (updateResult.affectedRows > 0) {
          console.log(`✅ Order ${orderId} → processing`);
          // Send confirmation email (only if we actually changed the status)
          const [orderRows]: any = await pool.query(
            `SELECT customer_name, customer_email, customer_phone, total, subtotal, vat_amount, shipping_cost,
                    created_at, customer_address, customer_city, customer_postal_code,
                    payment_method, tracking_token
             FROM orders WHERE id = ?`, [orderId]
          );
          const [itemRows]: any = await pool.query(
            `SELECT oi.quantity, oi.price, oi.color, oi.size, p.name,
                    JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) AS first_image
             FROM order_items oi JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`, [orderId]
          );
          if (orderRows.length > 0) {
            const o = orderRows[0];
            const orderDetailsForEmail = {
              total: parseFloat(o.total),
              subtotal: parseFloat(o.subtotal || o.total),
              shipping_cost: parseFloat(o.shipping_cost || 0),
              vat_amount: parseFloat(o.vat_amount || 0),
              created_at: o.created_at,
              customer_address: o.customer_address,
              customer_city: o.customer_city,
              customer_postal_code: o.customer_postal_code,
              payment_method: o.payment_method,
              tracking_token: o.tracking_token,
              items: itemRows.map((r: any) => ({
                name: r.name, quantity: r.quantity, price: parseFloat(r.price),
                color: r.color || undefined, size: r.size || undefined,
                image: r.first_image || undefined,
              })),
            };
            // Send email — PDF is optional; don't let PDF failure block the email
            (async () => {
              let pdfBuffer: Buffer | undefined;
              try {
                pdfBuffer = await generateInvoicePdf({
                  id: orderId,
                  payment_status: 'paid',
                  customer_name: o.customer_name,
                  customer_email: o.customer_email,
                  customer_phone: o.customer_phone || '',
                  ...orderDetailsForEmail,
                });
              } catch (pdfErr: any) {
                console.error('❌ Webhook PDF error (email will send without attachment):', pdfErr.message);
              }
              try {
                await emailService.sendOrderConfirmation(
                  o.customer_email, o.customer_name, String(orderId),
                  orderDetailsForEmail, 'pt', pdfBuffer
                );
              } catch (mailErr: any) {
                console.error('❌ Webhook email error:', mailErr.message);
              }
            })();
          }
        } else {
          console.log(`ℹ️  Order ${orderId} already processed (webhook duplicate)`);
        }
      } else {
        console.log(`⚠️  No order found for PI ${pi.id}`);
      }

    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;

      let orderId: number | null = null;
      const [byPI]: any = await pool.query(
        'SELECT id FROM orders WHERE payment_intent_id = ?', [pi.id]
      );
      if (byPI.length > 0) {
        orderId = byPI[0].id;
      } else if (pi.metadata?.order_id && !isNaN(parseInt(pi.metadata.order_id))) {
        orderId = parseInt(pi.metadata.order_id);
      }

      if (orderId) {
        await pool.execute(
          "UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
          [orderId]
        );
        console.log(`❌ Order ${orderId} → cancelled`);
      }
      // Clean up pending checkout if not yet finalized
      await pool.execute(
        'DELETE FROM pending_checkouts WHERE payment_intent_id = ?', [pi.id]
      ).catch(() => {});
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook event:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/payment/resend-confirmation/:orderId
// Admin: manually resend order confirmation email for an existing paid order.
// ---------------------------------------------------------------------------
router.post('/resend-confirmation/:orderId', async (req: any, res: any) => {
  const orderId = parseInt(req.params.orderId);
  if (isNaN(orderId)) {
    res.status(400).json({ error: 'Invalid order ID' });
    return;
  }

  try {
    const [orderRows]: any = await pool.query(
      `SELECT id, customer_name, customer_email, customer_phone, total, subtotal, vat_amount, shipping_cost,
              created_at, customer_address, customer_city, customer_postal_code,
              payment_method, tracking_token, payment_status
       FROM orders WHERE id = ?`, [orderId]
    );
    if (orderRows.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const o = orderRows[0];
    const [itemRows]: any = await pool.query(
      `SELECT oi.quantity, oi.price, oi.color, oi.size, p.name,
              JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]')) AS first_image
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`, [orderId]
    );

    const orderDetailsForEmail = {
      total: parseFloat(o.total),
      subtotal: parseFloat(o.subtotal || o.total),
      shipping_cost: parseFloat(o.shipping_cost || 0),
      vat_amount: parseFloat(o.vat_amount || 0),
      created_at: o.created_at,
      customer_address: o.customer_address,
      customer_city: o.customer_city,
      customer_postal_code: o.customer_postal_code,
      payment_method: o.payment_method,
      tracking_token: o.tracking_token,
      items: itemRows.map((r: any) => ({
        name: r.name, quantity: r.quantity, price: parseFloat(r.price),
        color: r.color || undefined, size: r.size || undefined,
        image: r.first_image || undefined,
      })),
    };

    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateInvoicePdf({
        id: orderId,
        payment_status: o.payment_status,
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        customer_phone: o.customer_phone || '',
        ...orderDetailsForEmail,
      });
    } catch (pdfErr: any) {
      console.error('❌ Resend PDF error:', pdfErr.message);
    }

    const result = await emailService.sendOrderConfirmation(
      o.customer_email, o.customer_name, String(orderId),
      orderDetailsForEmail, 'pt', pdfBuffer
    );

    if (result.success) {
      console.log(`✅ Confirmation re-sent for order ${orderId} to ${o.customer_email}`);
      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('Error resending confirmation:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
