import express from 'express';
import pool from '../config/database.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import { upload } from '../config/upload.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

const getProductDir = (productId: number): string =>
  path.join(__dirname, '../../public/produtos', String(productId));

const saveImageToDisk = async (productId: number, buffer: Buffer, index: number): Promise<string> => {
  const dir = getProductDir(productId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const base = `image-${index}-${productId}`;
  const opts = { effort: 6, smartSubsample: true };

  // lg — product detail page (max 1200 px, quality 85)
  await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85, ...opts })
    .toFile(path.join(dir, `${base}.webp`));

  // md — shop grid (max 600 px, quality 82)
  await sharp(buffer)
    .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, ...opts })
    .toFile(path.join(dir, `${base}-md.webp`));

  // sm — admin / cart thumbnails (max 280 px, quality 75)
  await sharp(buffer)
    .resize(280, 280, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75, ...opts })
    .toFile(path.join(dir, `${base}-sm.webp`));

  return `/produtos/${productId}/${base}.webp`;
};

const getNextImageIndex = (productId: number): number => {
  const dir = getProductDir(productId);
  if (!fs.existsSync(dir)) return 1;
  const files = fs.readdirSync(dir).filter(f => /^image-\d+-\d+\.webp$/.test(f));
  if (files.length === 0) return 1;
  const indices = files.map(f => parseInt(f.split('-')[1]));
  return Math.max(...indices) + 1;
};

const parseImages = (images: any): string[] => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try { return JSON.parse(images); } catch { return []; }
  }
  return [];
};

// ── GET all products (public) ─────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );

    const products = rows.map((product: any) => ({
      ...product,
      images: parseImages(product.images),
    }));

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── GET single product (public) ───────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ ...rows[0], images: parseImages(rows[0].images) });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ── POST / — Create product (admin) ──────────────────────────────────────────

router.post(
  '/',
  ...requireAdmin,
  upload.array('images', 10),
  async (req: AuthRequest, res) => {
    try {
      const { name, description, price, category, stock, featured, colors } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!name || !description || !price || !category) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'At least one image is required' });
        return;
      }

      let colorsArray: string[] = [];
      if (colors) {
        try {
          colorsArray = typeof colors === 'string' ? JSON.parse(colors) : colors;
        } catch (e) {
          console.error('Error parsing colors:', e);
        }
      }

      // Insert product first to obtain its ID
      const [result]: any = await pool.query(
        'INSERT INTO products (name, description, price, category_id, stock, featured, colors) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, category, stock || 0, featured === 'true', JSON.stringify(colorsArray)]
      );
      const productId = result.insertId;

      // Save each image to disk (generates lg / md / sm variants)
      const imagePaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        imagePaths.push(await saveImageToDisk(productId, files[i].buffer, i + 1));
      }

      // Store paths in products table
      await pool.query('UPDATE products SET images = ? WHERE id = ?', [
        JSON.stringify(imagePaths),
        productId,
      ]);

      const [newProduct]: any = await pool.query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`,
        [productId]
      );

      res.status(201).json({ ...newProduct[0], images: imagePaths });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// ── PUT /:id — Update product (admin) ────────────────────────────────────────

router.put(
  '/:id',
  ...requireAdmin,
  upload.array('images', 10),
  async (req: AuthRequest, res) => {
    try {
      console.log('🔄 UPDATE Product ID:', req.params.id);

      const { name, description, price, category, stock, featured, existingImages, colors } = req.body;
      const files = req.files as Express.Multer.File[];
      const productId = parseInt(req.params.id);

      // Update product fields
      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined)        { updates.push('name = ?');        values.push(name); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (price !== undefined)       { updates.push('price = ?');       values.push(price); }
      if (category !== undefined)    { updates.push('category_id = ?'); values.push(category); }
      if (stock !== undefined)       { updates.push('stock = ?');       values.push(stock); }
      if (featured !== undefined)    { updates.push('featured = ?');    values.push(featured === 'true'); }
      if (colors !== undefined) {
        try {
          const colorsArray = typeof colors === 'string' ? JSON.parse(colors) : colors;
          updates.push('colors = ?');
          values.push(JSON.stringify(colorsArray));
        } catch (e) {
          console.error('Error parsing colors:', e);
        }
      }

      if (updates.length > 0) {
        values.push(productId);
        await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      // Current images in DB
      const [currentRows]: any = await pool.query(
        'SELECT images FROM products WHERE id = ?',
        [productId]
      );
      const currentImages = parseImages(currentRows[0]?.images);

      // Parse the list of paths the admin wants to keep
      let keepPaths: string[] = [];
      if (existingImages) {
        try {
          keepPaths = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        } catch (e) {
          console.error('Error parsing existingImages:', e);
        }
      }

      // Delete files that were removed by the admin (including md/sm variants)
      const dir = getProductDir(productId);
      for (const currentPath of currentImages) {
        if (!keepPaths.includes(currentPath)) {
          const baseName = path.basename(currentPath, '.webp');
          for (const suffix of ['', '-md', '-sm']) {
            const filepath = path.join(dir, `${baseName}${suffix}.webp`);
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
              console.log('🗑️ Deleted image:', `${baseName}${suffix}.webp`);
            }
          }
        }
      }

      // Save new uploaded images (generates lg / md / sm variants)
      const newPaths: string[] = [];
      if (files && files.length > 0) {
        let nextIndex = getNextImageIndex(productId);
        for (const file of files) {
          newPaths.push(await saveImageToDisk(productId, file.buffer, nextIndex));
          nextIndex++;
        }
      }

      // Final order: existing (in admin's order) + newly uploaded
      const finalImages = [...keepPaths, ...newPaths];
      await pool.query('UPDATE products SET images = ? WHERE id = ?', [
        JSON.stringify(finalImages),
        productId,
      ]);

      const [updatedProduct]: any = await pool.query(
        `SELECT p.*, c.name as category_name, c.slug as category_slug
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`,
        [productId]
      );

      if (updatedProduct.length === 0) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json({ ...updatedProduct[0], images: finalImages });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

// ── DELETE /:id — Delete product (admin) ─────────────────────────────────────

router.delete('/:id', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(req.params.id);

    const [result]: any = await pool.query(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Remove image directory from disk
    const dir = getProductDir(productId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log('🗑️ Deleted product image directory for ID', productId);
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
