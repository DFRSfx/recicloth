import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  user_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_postal_code: string;
  total: number;
  status: OrderStatus;
  payment_method: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderInput {
  user_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_postal_code: string;
  total: number;
  status?: OrderStatus;
  payment_method: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
  product_image?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  user_id?: number;
  startDate?: Date;
  endDate?: Date;
}

class OrderModel {
  static async findById(id: number): Promise<Order | null> {
    const [rows] = await pool.execute<(Order & RowDataPacket)[]>(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByIdWithItems(id: number): Promise<OrderWithItems | null> {
    const order = await this.findById(id);
    if (!order) return null;

    const [items] = await pool.execute<RowDataPacket[]>(
      `SELECT oi.*, p.name as product_name, p.image as product_image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    return {
      ...order,
      items: items as OrderItem[]
    };
  }

  static async findAll(filters?: OrderFilters): Promise<Order[]> {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (filters) {
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.user_id) {
        query += ' AND user_id = ?';
        params.push(filters.user_id);
      }

      if (filters.startDate) {
        query += ' AND created_at >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND created_at <= ?';
        params.push(filters.endDate);
      }
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute<(Order & RowDataPacket)[]>(query, params);
    return rows;
  }

  static async findByUser(userId: number): Promise<Order[]> {
    return this.findAll({ user_id: userId });
  }

  static async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.findAll({ status });
  }

  static async create(orderData: OrderInput): Promise<number> {
    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_city,
      customer_postal_code,
      total,
      status,
      payment_method
    } = orderData;

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO orders (
        user_id, customer_name, customer_email, customer_phone,
        customer_address, customer_city, customer_postal_code,
        total, status, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id || null,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        customer_city,
        customer_postal_code,
        total,
        status || 'pending',
        payment_method
      ]
    );
    return result.insertId;
  }

  static async updateStatus(id: number, status: OrderStatus): Promise<void> {
    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  static async update(id: number, orderData: Partial<OrderInput>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(orderData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) return;

    params.push(id);
    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;
    await pool.execute(query, params);
  }

  static async delete(id: number): Promise<void> {
    await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
  }

  static async count(filters?: OrderFilters): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const params: any[] = [];

    if (filters) {
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters.user_id) {
        query += ' AND user_id = ?';
        params.push(filters.user_id);
      }
    }

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows[0].total;
  }

  static async getTotalRevenue(filters?: { startDate?: Date; endDate?: Date }): Promise<number> {
    let query = `SELECT SUM(total) as revenue FROM orders WHERE status != 'cancelled'`;
    const params: any[] = [];

    if (filters) {
      if (filters.startDate) {
        query += ' AND created_at >= ?';
        params.push(filters.startDate);
      }
      if (filters.endDate) {
        query += ' AND created_at <= ?';
        params.push(filters.endDate);
      }
    }

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows[0].revenue || 0;
  }

  static async getRecentOrders(limit: number = 10): Promise<Order[]> {
    const [rows] = await pool.execute<(Order & RowDataPacket)[]>(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows;
  }
}

export default OrderModel;
