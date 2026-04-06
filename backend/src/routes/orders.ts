import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { requireAdmin, authenticateToken, AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';
import emailService from '../emailService.js';
import { BUSINESS_RULES, ORDER_STATUS_MAP, OrderStatusLabel } from '../config/businessRules.js';
import { calculateShipping } from '../utils/shippingCalculator.js';

const router = express.Router();

function generateTrackingToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

const parseOrderItems = (row: any) => {
  const raw = row.order_items || [];
  const items = Array.isArray(raw) ? raw : JSON.parse(raw);
  return items.map((item: any) => ({
    ...item,
    price: Number(item.price || 0),
    product: item.product || null
  }));
};

const mapStatusToDb = (status: string): string => {
  if ((BUSINESS_RULES.ORDER_STATUSES as readonly string[]).includes(status)) {
    return ORDER_STATUS_MAP[status as OrderStatusLabel];
  }
  return status;
};

const isStatusAllowed = (status: string): boolean => {
  const allowedDb = Object.values(ORDER_STATUS_MAP);
  return allowedDb.includes(status as any) || (BUSINESS_RULES.ORDER_STATUSES as readonly string[]).includes(status);
};

router.get('/', ...requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const [orders]: any = await pool.query(`
      SELECT
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'price', oi.price,
              'color', oi.color,
              'size', oi.size,
              'product', json_build_object(
                'id', p.id,
                'name', p.name,
                'images', COALESCE(p.images::jsonb, '[]'::jsonb),
                'image', COALESCE((p.images::jsonb ->> 0), '')
              )
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.json(
      orders.map((order: any) => ({
        ...order,
        order_items: parseOrderItems(order)
      }))
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/my-orders', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [orders]: any = await pool.query(
      `
      SELECT
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'price', oi.price,
              'color', oi.color,
              'size', oi.size,
              'product', json_build_object(
                'id', p.id,
                'name', p.name,
                'images', COALESCE(p.images::jsonb, '[]'::jsonb),
                'image', COALESCE((p.images::jsonb ->> 0), '')
              )
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      `,
      [req.user?.id]
    );

    res.json(
      orders.map((order: any) => ({
        ...order,
        order_items: parseOrderItems(order)
      }))
    );
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [orders]: any = await pool.query(
      `
      SELECT
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'price', oi.price,
              'color', oi.color,
              'size', oi.size,
              'product', json_build_object(
                'id', p.id,
                'name', p.name,
                'images', COALESCE(p.images::jsonb, '[]'::jsonb),
                'image', COALESCE((p.images::jsonb ->> 0), '')
              )
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      GROUP BY o.id
      `,
      [req.params.id]
    );

    if (orders.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      ...orders[0],
      order_items: parseOrderItems(orders[0])
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post(
  '/',
  [
    body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
    body('customer_email').isEmail().withMessage('Valid email is required'),
    body('customer_phone').trim().notEmpty().withMessage('Phone is required'),
    body('customer_address').trim().notEmpty().withMessage('Address is required'),
    body('customer_city').trim().notEmpty().withMessage('City is required'),
    body('customer_postal_code').trim().notEmpty().withMessage('Postal code is required'),
    body('delivery_country').trim().notEmpty().withMessage('Delivery country is required'),
    body('payment_method')
      .isIn(['Transferência Bancária', 'MBWay'])
      .withMessage('Payment method is invalid'),
    body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('items.*.product_id').isInt().withMessage('Product ID must be an integer'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('save_address').optional().isBoolean()
  ],
  async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        customer_city,
        customer_postal_code,
        delivery_country,
        payment_method,
        items,
        save_address,
        user_id
      } = req.body;

      const normalizedCountry = String(delivery_country).toUpperCase();
      const eligibleCountries = BUSINESS_RULES.SHIPPING.ELIGIBLE_COUNTRIES as readonly string[];
      if (!eligibleCountries.includes(normalizedCountry)) {
        res.status(400).json({ error: 'Apenas entregamos na União Europeia.' });
        return;
      }

      const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
      const vatAmount = Number((subtotal * BUSINESS_RULES.VAT_RATE).toFixed(2));
      const totalItemCount = items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
      const shipping = calculateShipping(normalizedCountry, totalItemCount, subtotal);
      const shippingCost = Number(shipping.cost.toFixed(2));
      const total = Number((subtotal + vatAmount + shippingCost).toFixed(2));

      const trackingToken = generateTrackingToken();
      const [orderResult]: any = await connection.query(
        `INSERT INTO orders (
          tracking_token, user_id, customer_name, customer_email, customer_phone,
          customer_address, customer_city, customer_postal_code, delivery_country,
          payment_method, subtotal, vat_amount, shipping_cost, total, status, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trackingToken, user_id || null, customer_name, customer_email, customer_phone,
          customer_address, customer_city, customer_postal_code, normalizedCountry,
          payment_method, subtotal, vatAmount, shippingCost, total, 'pending', 'pending'
        ]
      );

      const orderId = orderResult.insertId;

      for (const item of items) {
        const [products]: any = await connection.query(
          'SELECT id, stock, name FROM products WHERE id = ?',
          [item.product_id]
        );

        if (products.length === 0) {
          throw new Error(`Produto ${item.product_id} não encontrado`);
        }

        if (Number(products[0].stock) < Number(item.quantity)) {
          throw new Error(`Stock insuficiente para o produto ${products[0].name}`);
        }

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
        const [existingAddresses]: any = await connection.query(
          `SELECT id FROM shipping_addresses
           WHERE user_id = ? AND address = ? AND city = ? AND postal_code = ?`,
          [user_id, customer_address, customer_city, customer_postal_code]
        );

        if (existingAddresses.length === 0) {
          const [addressCount]: any = await connection.query(
            'SELECT COUNT(*) as count FROM shipping_addresses WHERE user_id = ?',
            [user_id]
          );

          const isFirstAddress = Number(addressCount[0].count) === 0;

          await connection.query(
            `INSERT INTO shipping_addresses
             (user_id, name, address, city, postal_code, phone, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, 'Morada Principal', customer_address, customer_city, customer_postal_code, customer_phone, isFirstAddress]
          );
        }
      }

      await connection.commit();

      const [newOrderRows]: any = await connection.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      const newOrder = newOrderRows[0];

      await emailService.sendOrderConfirmation(
        customer_email,
        customer_name,
        String(orderId),
        {
          total,
          items: items.map((item: any) => ({
            name: item.name || `Produto #${item.product_id}`,
            quantity: Number(item.quantity),
            price: Number(item.price)
          }))
        },
        'pt'
      );

      res.status(201).json({
        ...newOrder,
        totals: {
          subtotal: Number(subtotal.toFixed(2)),
          vat_rate: BUSINESS_RULES.VAT_RATE,
          vat_amount: vatAmount,
          shipping_cost: shippingCost,
          total,
          currency: BUSINESS_RULES.CURRENCY
        },
        tracking_url: `/track-order/${trackingToken}`
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error creating order:', error);
      res.status(500).json({
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      connection.release();
    }
  }
);

router.patch(
  '/:id/payment-reference',
  [
    body('entity').trim().notEmpty().withMessage('Entity is required'),
    body('reference').trim().notEmpty().withMessage('Reference is required')
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { entity, reference } = req.body;

      await pool.query(
        'UPDATE orders SET payment_entity = ?, payment_reference = ? WHERE id = ?',
        [entity, reference, req.params.id]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving payment reference:', error);
      res.status(500).json({ error: 'Failed to save payment reference' });
    }
  }
);

router.patch(
  '/:id/status',
  ...requireAdmin,
  [body('status').trim().notEmpty().withMessage('Invalid status')],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const mappedStatus = mapStatusToDb(req.body.status);
      if (!isStatusAllowed(mappedStatus)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      const [updateResult]: any = await pool.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [mappedStatus, req.params.id]
      );

      if (updateResult.affectedRows === 0) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      const [updatedOrder]: any = await pool.query(
        'SELECT * FROM orders WHERE id = ?',
        [req.params.id]
      );

      if (mappedStatus === 'shipped') {
        const [itemRows]: any = await pool.query(
          `SELECT oi.quantity, oi.price, oi.color, oi.size, p.name
           FROM order_items oi JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`, [req.params.id]
        );
        const o = updatedOrder[0];
        emailService.sendShippingConfirmation(
          o.customer_email,
          o.customer_name,
          String(o.id),
          {
            total: parseFloat(o.total),
            created_at: o.created_at,
            customer_address: o.customer_address,
            customer_city: o.customer_city,
            customer_postal_code: o.customer_postal_code,
            payment_method: o.payment_method,
            tracking_token: o.tracking_token,
            items: itemRows.map((r: any) => ({
              name: r.name, quantity: r.quantity, price: parseFloat(r.price),
              color: r.color || undefined, size: r.size || undefined
            }))
          }
        ).catch((err: any) => console.error('❌ Shipping email error:', err.message));
      }

      res.json(updatedOrder[0]);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  }
);

router.delete('/:id', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [result]: any = await pool.query(
      'DELETE FROM orders WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

router.get('/track/:token', async (req, res) => {
  try {
    const [orders]: any = await pool.query(
      `
      SELECT
        o.id,
        o.tracking_token,
        o.customer_name,
        o.customer_email,
        o.customer_address,
        o.customer_city,
        o.customer_postal_code,
        o.delivery_country,
        o.subtotal,
        o.vat_amount,
        o.shipping_cost,
        o.total,
        o.status,
        o.payment_status,
        o.payment_method,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'quantity', oi.quantity,
              'price', oi.price,
              'color', oi.color,
              'size', oi.size,
              'product', json_build_object(
                'id', p.id,
                'name', p.name,
                'images', COALESCE(p.images::jsonb, '[]'::jsonb),
                'image', COALESCE((p.images::jsonb ->> 0), '')
              )
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.tracking_token = ?
      GROUP BY o.id
      `,
      [req.params.token]
    );

    if (orders.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      ...orders[0],
      order_items: parseOrderItems(orders[0]),
      totals: {
        subtotal: Number(orders[0].subtotal || 0),
        vat_rate: BUSINESS_RULES.VAT_RATE,
        vat_amount: Number(orders[0].vat_amount || 0),
        shipping_cost: Number(orders[0].shipping_cost || 0),
        total: Number(orders[0].total || 0),
        currency: BUSINESS_RULES.CURRENCY
      }
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

export default router;
