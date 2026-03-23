import express from 'express';
import pool from '../config/database.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics (admin only)
router.get('/dashboard', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    // Get total orders
    const [orderCount]: any = await pool.query(
      'SELECT COUNT(*) as total FROM orders'
    );
    const totalOrders = orderCount[0].total;

    // Get total revenue (only from paid/completed orders)
    const [revenueResult]: any = await pool.query(
      "SELECT SUM(total) as revenue FROM orders WHERE status IN ('processing', 'shipped', 'delivered')"
    );
    const totalRevenue = revenueResult[0].revenue || 0;

    // Get total products
    const [productCount]: any = await pool.query(
      'SELECT COUNT(*) as total FROM products'
    );
    const totalProducts = productCount[0].total;

    // Get pending orders count
    const [pendingCount]: any = await pool.query(
      "SELECT COUNT(*) as total FROM orders WHERE status = 'pending'"
    );
    const pendingOrders = pendingCount[0].total;

    // Get total users count
    const [userCount]: any = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE role != "admin"'
    );
    const totalUsers = userCount[0].total;

    // Get recent orders
    const [recentOrders] = await pool.query(`
      SELECT * FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Get low stock products with images and category names
    const [lowStockProducts]: any = await pool.query(`
      SELECT p.*, c.name as category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock <= 10
      ORDER BY p.stock ASC
      LIMIT 5
    `);

    const lowStockProductsWithImages = lowStockProducts.map((product: any) => ({
      ...product,
      images: product.images
        ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images)
        : []
    }));

    // Get sales by category
    const [categorySales]: any = await pool.query(`
      SELECT
        c.name as category,
        SUM(oi.quantity) as quantity,
        SUM(oi.price * oi.quantity) as total
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.name
      ORDER BY total DESC
    `);

    const salesByCategory: Record<string, { total: number; quantity: number }> = {};
    categorySales.forEach((row: any) => {
      salesByCategory[row.category] = {
        total: parseFloat(row.total),
        quantity: row.quantity
      };
    });

    res.json({
      totalOrders,
      totalRevenue: Number(totalRevenue).toFixed(2),
      totalProducts,
      pendingOrders,
      totalUsers,
      recentOrders,
      lowStockProducts: lowStockProductsWithImages,
      salesByCategory
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
