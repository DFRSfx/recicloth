import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { requireAdmin, authenticateToken, AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Generate unique tracking token
function generateTrackingToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Get all orders (admin only)
router.get('/', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [orders]: any = await pool.query(`
      SELECT
        o.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', oi.id,
            'quantity', oi.quantity,
            'price', oi.price,
            'product', JSON_OBJECT(
              'id', p.id,
              'name', p.name,
              'image', JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]'))
            )
          )
        ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    // Parse JSON strings
    const parsedOrders = orders.map((order: any) => ({
      ...order,
      order_items: order.order_items ? JSON.parse(`[${order.order_items}]`) : []
    }));

    res.json(parsedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get user's orders (authenticated) - MUST be before /:id route!
router.get('/my-orders', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('📦 /my-orders called by user:', req.user?.id, req.user?.email);
    
    const [orders]: any = await pool.query(`
      SELECT
        o.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', oi.id,
            'quantity', oi.quantity,
            'price', oi.price,
            'product', JSON_OBJECT(
              'id', p.id,
              'name', p.name,
              'image', JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]'))
            )
          )
        ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [req.user?.id]);

    const parsedOrders = orders.map((order: any) => ({
      ...order,
      order_items: order.order_items ? JSON.parse(`[${order.order_items}]`) : []
    }));

    res.json(parsedOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order (admin only)
router.get('/:id', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [orders]: any = await pool.query(`
      SELECT
        o.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', oi.id,
            'quantity', oi.quantity,
            'price', oi.price,
            'product', JSON_OBJECT(
              'id', p.id,
              'name', p.name,
              'image', JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]'))
            )
          )
        ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      GROUP BY o.id
    `, [req.params.id]);

    if (orders.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = {
      ...orders[0],
      order_items: orders[0].order_items ? JSON.parse(`[${orders[0].order_items}]`) : []
    };

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create order (public/authenticated)
router.post(
  '/',
  [
    body('customer_name').trim().notEmpty().withMessage('Customer name is required'),
    body('customer_email').isEmail().withMessage('Valid email is required'),
    body('customer_phone').trim().notEmpty().withMessage('Phone is required'),
    body('customer_address').trim().notEmpty().withMessage('Address is required'),
    body('customer_city').trim().notEmpty().withMessage('City is required'),
    body('customer_postal_code').trim().notEmpty().withMessage('Postal code is required'),
    body('payment_method').trim().notEmpty().withMessage('Payment method is required'),
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
        console.error('Validation errors:', errors.array());
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
        payment_method,
        items,
        save_address,
        user_id
      } = req.body;

      console.log('Creating order with data:', {
        customer_name,
        customer_email,
        user_id: user_id || 'guest',
        items_count: items.length
      });

      // Calculate total including 23% VAT (matches what Stripe charges)
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const total = parseFloat((subtotal * 1.23).toFixed(2));

      // Generate tracking token for guest orders
      const trackingToken = generateTrackingToken();

      console.log('Generated tracking token:', trackingToken);

      // Create order
      let orderId: number;
      try {
        const [orderResult]: any = await connection.query(
          `INSERT INTO orders (
            tracking_token, user_id, customer_name, customer_email, customer_phone,
            customer_address, customer_city, customer_postal_code,
            payment_method, total, status, payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            trackingToken, user_id || null, customer_name, customer_email, customer_phone,
            customer_address, customer_city, customer_postal_code,
            payment_method, total, 'pending', 'pending'
          ]
        );

        orderId = orderResult.insertId;
        console.log('Order created successfully, ID:', orderId);
      } catch (insertError: any) {
        console.error('❌ Error inserting order:', insertError.message);
        console.error('SQL Error code:', insertError.code);
        console.error('SQL Error details:', insertError.sqlMessage);
        throw new Error(`Database error: ${insertError.message}`);
      }

      // Create order items
      for (const item of items) {
        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price]
        );

        // Update product stock (GREATEST prevents unsigned underflow when stock is 0)
        await connection.query(
          'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Save address if user is authenticated and requested
      if (user_id && save_address) {
        // Check if address already exists
        const [existingAddresses]: any = await connection.query(
          `SELECT id FROM shipping_addresses 
           WHERE user_id = ? AND address = ? AND city = ? AND postal_code = ?`,
          [user_id, customer_address, customer_city, customer_postal_code]
        );

        if (existingAddresses.length === 0) {
          // Get count of existing addresses
          const [addressCount]: any = await connection.query(
            'SELECT COUNT(*) as count FROM shipping_addresses WHERE user_id = ?',
            [user_id]
          );

          const isFirstAddress = addressCount[0].count === 0;

          await connection.query(
            `INSERT INTO shipping_addresses 
             (user_id, name, address, city, postal_code, phone, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, 'Morada Principal', customer_address, customer_city, customer_postal_code, customer_phone, isFirstAddress ? 1 : 0]
          );
        }
      }

      await connection.commit();

      const [newOrder]: any = await connection.query(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      res.status(201).json({
        ...newOrder[0],
        tracking_url: `/track-order/${trackingToken}`
      });
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error creating order:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      res.status(500).json({ 
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      connection.release();
    }
  }
);

// Save Multibanco payment reference after Stripe confirmation (public)
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

// Update order status (admin only)
router.patch(
  '/:id/status',
  ...requireAdmin,
  [
    body('status')
      .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid status')
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { status } = req.body;

      await pool.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, req.params.id]
      );

      const [updatedOrder]: any = await pool.query(
        'SELECT * FROM orders WHERE id = ?',
        [req.params.id]
      );

      if (updatedOrder.length === 0) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json(updatedOrder[0]);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  }
);

// Delete order (admin only)
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

// Track order by token (public - for guest orders)
router.get('/track/:token', async (req, res) => {
  try {
    const [orders]: any = await pool.query(`
      SELECT
        o.id,
        o.tracking_token,
        o.customer_name,
        o.customer_email,
        o.customer_address,
        o.customer_city,
        o.customer_postal_code,
        o.total,
        o.status,
        o.payment_status,
        o.payment_method,
        o.created_at,
        o.updated_at,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', oi.id,
            'quantity', oi.quantity,
            'price', oi.price,
            'product', JSON_OBJECT(
              'id', p.id,
              'name', p.name,
              'image', JSON_UNQUOTE(JSON_EXTRACT(p.images, '$[0]'))
            )
          )
        ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.tracking_token = ?
      GROUP BY o.id
    `, [req.params.token]);

    if (orders.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = {
      ...orders[0],
      order_items: orders[0].order_items ? JSON.parse(`[${orders[0].order_items}]`) : []
    };

    res.json(order);
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

export default router;
