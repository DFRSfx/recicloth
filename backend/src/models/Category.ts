import pool from '../config/database.js';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  created_at: Date;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

class CategoryModel {
  static async findById(id: number): Promise<Category | null> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findBySlug(slug: string): Promise<Category | null> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM categories WHERE slug = ?',
      [slug]
    );
    return rows[0] || null;
  }

  static async findAll(): Promise<Category[]> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return rows;
  }

  static async create(categoryData: CategoryInput): Promise<number> {
    const { name, slug, description, image } = categoryData;
    const [result]: any = await pool.execute(
      'INSERT INTO categories (name, slug, description, image) VALUES (?, ?, ?, ?)',
      [name, slug, description || null, image || null]
    );
    return result.insertId;
  }

  static async update(id: number, categoryData: Partial<CategoryInput>): Promise<void> {
    const { name, slug, description, image } = categoryData;
    await pool.execute(
      'UPDATE categories SET name = ?, slug = ?, description = ?, image = ? WHERE id = ?',
      [name, slug, description || null, image || null, id]
    );
  }

  static async delete(id: number): Promise<void> {
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
  }

  static async count(): Promise<number> {
    const [rows]: any = await pool.execute(
      'SELECT COUNT(*) as total FROM categories'
    );
    return rows[0].total;
  }
}

export default CategoryModel;
