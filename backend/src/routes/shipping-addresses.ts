import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get user's shipping addresses
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [addresses] = await pool.query(
      `SELECT * FROM shipping_addresses 
       WHERE user_id = ? 
       ORDER BY is_default DESC, created_at DESC`,
      [req.user?.id]
    );
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Create new shipping address
router.post(
  '/',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('postal_code').trim().notEmpty().withMessage('Postal code is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('is_default').optional().isBoolean()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, address, city, postal_code, phone, is_default } = req.body;
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // If setting as default, unset all other defaults
        if (is_default) {
          await connection.query(
            'UPDATE shipping_addresses SET is_default = FALSE WHERE user_id = ?',
            [req.user?.id]
          );
        }

        const [result]: any = await connection.query(
          `INSERT INTO shipping_addresses 
           (user_id, name, address, city, postal_code, phone, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [req.user?.id, name, address, city, postal_code, phone, is_default || false]
        );

        await connection.commit();

        const [newAddress]: any = await connection.query(
          'SELECT * FROM shipping_addresses WHERE id = ?',
          [result.insertId]
        );

        res.status(201).json(newAddress[0]);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating address:', error);
      res.status(500).json({ error: 'Failed to create address' });
    }
  }
);

// Update shipping address
router.put(
  '/:id',
  authenticateToken,
  [
    body('name').optional().trim().notEmpty(),
    body('address').optional().trim().notEmpty(),
    body('city').optional().trim().notEmpty(),
    body('postal_code').optional().trim().notEmpty(),
    body('phone').optional().trim().notEmpty(),
    body('is_default').optional().isBoolean()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        // Verify ownership
        const [existing]: any = await connection.query(
          'SELECT * FROM shipping_addresses WHERE id = ? AND user_id = ?',
          [req.params.id, req.user?.id]
        );

        if (existing.length === 0) {
          res.status(404).json({ error: 'Address not found' });
          return;
        }

        const updates = req.body;

        // If setting as default, unset all other defaults
        if (updates.is_default) {
          await connection.query(
            'UPDATE shipping_addresses SET is_default = FALSE WHERE user_id = ?',
            [req.user?.id]
          );
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), req.params.id, req.user?.id];

        await connection.query(
          `UPDATE shipping_addresses SET ${fields} WHERE id = ? AND user_id = ?`,
          values
        );

        await connection.commit();

        const [updated]: any = await connection.query(
          'SELECT * FROM shipping_addresses WHERE id = ?',
          [req.params.id]
        );

        res.json(updated[0]);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({ error: 'Failed to update address' });
    }
  }
);

// Delete shipping address
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [result]: any = await pool.query(
      'DELETE FROM shipping_addresses WHERE id = ? AND user_id = ?',
      [req.params.id, req.user?.id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

export default router;
