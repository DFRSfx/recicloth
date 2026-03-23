import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcrypt';

export type UserRole = 'customer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  n_telemovel?: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

export interface UserInput {
  email: string;
  password: string;
  name: string;
  n_telemovel?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface SafeUser extends Omit<User, 'password'> {}

class UserModel {
  private static readonly SALT_ROUNDS = 10;

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<(User & RowDataPacket)[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<(User & RowDataPacket)[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findAll(role?: UserRole): Promise<SafeUser[]> {
    let query = 'SELECT id, email, name, n_telemovel, role, status, created_at, updated_at FROM users';
    const params: any[] = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute<(SafeUser & RowDataPacket)[]>(query, params);
    return rows;
  }

  static async create(userData: UserInput): Promise<number> {
    const { email, password, name, n_telemovel, role, status } = userData;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (email, password, name, n_telemovel, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, name, n_telemovel || null, role || 'customer', status || 'active']
    );
    return result.insertId;
  }

  static async update(id: number, userData: Partial<UserInput>): Promise<void> {
    const { email, password, name, n_telemovel, role, status } = userData;

    const updates: string[] = [];
    const params: any[] = [];

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
      updates.push('password = ?');
      params.push(hashedPassword);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (n_telemovel !== undefined) {
      updates.push('n_telemovel = ?');
      params.push(n_telemovel);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) return;

    params.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await pool.execute(query, params);
  }

  static async delete(id: number): Promise<void> {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(id: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  }

  static async count(role?: UserRole): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM users';
    const params: any[] = [];

    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    return rows[0].total;
  }

  static async getSafeUser(user: User): Promise<SafeUser> {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}

export default UserModel;
