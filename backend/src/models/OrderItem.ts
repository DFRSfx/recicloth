import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface OrderItemInput {
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
}

export interface OrderItemWithProduct extends OrderItem {
  product_name: string;
  product_image: string;
  product_description?: string;
}

class OrderItemModel {
  static async findById(id: number): Promise<OrderItem | null> {
    const [rows] = await pool.execute<(OrderItem & RowDataPacket)[]>(
      'SELECT * FROM order_items WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByOrderId(orderId: number): Promise<OrderItemWithProduct[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        oi.*,
        p.name as product_name,
        p.image as product_image,
        p.description as product_description
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    return rows as OrderItemWithProduct[];
  }

  static async findByProductId(productId: number): Promise<OrderItem[]> {
    const [rows] = await pool.execute<(OrderItem & RowDataPacket)[]>(
      'SELECT * FROM order_items WHERE product_id = ?',
      [productId]
    );
    return rows;
  }

  static async create(itemData: OrderItemInput): Promise<number> {
    const { order_id, product_id, quantity, price } = itemData;

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [order_id, product_id, quantity, price]
    );
    return result.insertId;
  }

  static async createBulk(items: OrderItemInput[]): Promise<void> {
    if (items.length === 0) return;

    const values = items.map(item => [item.order_id, item.product_id, item.quantity, item.price]);

    await pool.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
      [values]
    );
  }

  static async update(id: number, itemData: Partial<OrderItemInput>): Promise<void> {
    const { product_id, quantity, price } = itemData;

    const updates: string[] = [];
    const params: any[] = [];

    if (product_id !== undefined) {
      updates.push('product_id = ?');
      params.push(product_id);
    }
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }

    if (updates.length === 0) return;

    params.push(id);
    const query = `UPDATE order_items SET ${updates.join(', ')} WHERE id = ?`;
    await pool.execute(query, params);
  }

  static async delete(id: number): Promise<void> {
    await pool.execute('DELETE FROM order_items WHERE id = ?', [id]);
  }

  static async deleteByOrderId(orderId: number): Promise<void> {
    await pool.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
  }

  static async getOrderTotal(orderId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT SUM(quantity * price) as total FROM order_items WHERE order_id = ?',
      [orderId]
    );
    return rows[0].total || 0;
  }

  static async getProductSalesCount(productId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT SUM(quantity) as total FROM order_items WHERE product_id = ?',
      [productId]
    );
    return rows[0].total || 0;
  }

  static async getBestSellingProducts(limit: number = 10): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        p.id,
        p.name,
        p.image,
        p.price,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       GROUP BY p.id, p.name, p.image, p.price
       ORDER BY total_sold DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }
}

export default OrderItemModel;
