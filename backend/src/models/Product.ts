import pool from '../config/database';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number; // FK to categories table
  colors?: string[]; // JSON array of available colors
  stock: number;
  featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithCategory extends Product {
  category_name?: string;
  category_slug?: string;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  category_id: number; // FK to categories table
  colors?: string[];
  stock: number;
  featured?: boolean;
}

export interface ProductFilters {
  category_id?: number;
  category_slug?: string; // Filter by slug instead of ID (more user-friendly)
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
}

class ProductModel {
  static async findById(id: number): Promise<Product | null> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (rows.length === 0) return null;

    const product = rows[0] as any;
    // Parse JSON fields if they exist
    if (product.colors && typeof product.colors === 'string') {
      try {
        product.colors = JSON.parse(product.colors);
      } catch (e) {
        product.colors = [];
      }
    }

    return product as Product;
  }

  static async findAll(filters?: ProductFilters): Promise<ProductWithCategory[]> {
    let query = `
      SELECT
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters) {
      if (filters.category_id) {
        query += ' AND p.category_id = ?';
        params.push(filters.category_id);
      }

      if (filters.category_slug) {
        query += ' AND c.slug = ?';
        params.push(filters.category_slug);
      }

      if (filters.featured !== undefined) {
        query += ' AND p.featured = ?';
        params.push(filters.featured);
      }

      if (filters.minPrice !== undefined) {
        query += ' AND p.price >= ?';
        params.push(filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query += ' AND p.price <= ?';
        params.push(filters.maxPrice);
      }

      if (filters.search) {
        query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      if (filters.inStock) {
        query += ' AND p.stock > 0';
      }
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows]: any = await pool.execute(query, params);

    // Parse JSON fields
    return rows.map(row => {
      const product = row as any;
      if (product.colors && typeof product.colors === 'string') {
        try {
          product.colors = JSON.parse(product.colors);
        } catch (e) {
          product.colors = [];
        }
      }
      return product as ProductWithCategory;
    });
  }

  static async findByCategory(categoryId: number): Promise<ProductWithCategory[]> {
    return this.findAll({ category_id: categoryId });
  }

  static async findByCategorySlug(slug: string): Promise<ProductWithCategory[]> {
    return this.findAll({ category_slug: slug });
  }

  static async findFeatured(): Promise<Product[]> {
    return this.findAll({ featured: true });
  }

  static async create(productData: ProductInput): Promise<number> {
    const { name, description, price, category_id, colors, stock, featured } = productData;

    // Convert colors array to JSON string
    const colorsJson = colors ? JSON.stringify(colors) : null;

    const [result]: any = await pool.execute(
      'INSERT INTO products (name, description, price, category_id, colors, stock, featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, category_id, colorsJson, stock, featured || false]
    );
    return result.insertId;
  }

  static async update(id: number, productData: Partial<ProductInput>): Promise<void> {
    const { name, description, price, category_id, colors, stock, featured } = productData;

    // Convert colors array to JSON string if provided
    const colorsJson = colors !== undefined ? JSON.stringify(colors) : undefined;

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(category_id);
    }
    if (colorsJson !== undefined) {
      updates.push('colors = ?');
      params.push(colorsJson);
    }
    if (stock !== undefined) {
      updates.push('stock = ?');
      params.push(stock);
    }
    if (featured !== undefined) {
      updates.push('featured = ?');
      params.push(featured);
    }

    if (updates.length === 0) return;

    params.push(id);
    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
    await pool.execute(query, params);
  }

  static async delete(id: number): Promise<void> {
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  }

  static async updateStock(id: number, quantity: number): Promise<void> {
    await pool.execute(
      'UPDATE products SET stock = stock + ? WHERE id = ?',
      [quantity, id]
    );
  }

  static async count(filters?: ProductFilters): Promise<number> {
    let query = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters) {
      if (filters.category_id) {
        query += ' AND p.category_id = ?';
        params.push(filters.category_id);
      }
      if (filters.category_slug) {
        query += ' AND c.slug = ?';
        params.push(filters.category_slug);
      }
      if (filters.featured !== undefined) {
        query += ' AND p.featured = ?';
        params.push(filters.featured);
      }
      if (filters.inStock) {
        query += ' AND p.stock > 0';
      }
    }

    const [rows]: any = await pool.execute(query, params);
    return rows[0].total;
  }
}

export default ProductModel;
