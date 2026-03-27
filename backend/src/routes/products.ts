import express from 'express';
import pool from '../config/database.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import { upload } from '../config/upload.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getCached, setCached, clearCachedByPrefix } from '../utils/apiCache.js';
import { warmCaches } from '../utils/dataWarmer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

const getProductDir = (productId: number): string =>
  path.join(__dirname, '../../public/produtos', String(productId));

const toColorSlug = (value?: string): string => {
  if (!value) return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
};

const saveImageToDisk = async (
  productId: number,
  buffer: Buffer,
  index: number,
  colorName?: string
): Promise<string> => {
  const { default: sharp } = await import('sharp');
  const dir = getProductDir(productId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const colorSlug = toColorSlug(colorName);
  const base = colorSlug
    ? `image-${index}-${productId}-${colorSlug}`
    : `image-${index}-${productId}`;
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
  const files = fs.readdirSync(dir).filter(f => /^image-\d+-\d+(?:-[a-z0-9-]+)?\.webp$/.test(f));
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
    // Lazy cache warming on first request (prevents startup connection exhaustion on serverless)
    warmCaches().catch(err => console.error('Lazy cache warm failed:', err));

    const cacheKey = 'products:list';
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

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

    setCached(cacheKey, products, 60_000);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.setHeader('X-Cache', 'MISS');
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
      const { name, description, price, category, stock, stockMode, featured, colors, imageColors, sizeStock } = req.body;
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

      let imageColorsArray: string[] = [];
      if (imageColors) {
        try {
          const parsed = typeof imageColors === 'string' ? JSON.parse(imageColors) : imageColors;
          imageColorsArray = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Error parsing imageColors:', e);
        }
      }

      let sizeStockArray: Array<{ size: string; stock: number }> = [];
      if (sizeStock) {
        try {
          const parsed = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
          sizeStockArray = Array.isArray(parsed)
            ? parsed
                .map((item: any) => ({
                  size: String(item?.size || '').toUpperCase(),
                  stock: Math.max(0, parseInt(String(item?.stock ?? 0), 10) || 0),
                }))
                .filter((item) => item.size)
            : [];
        } catch (e) {
          console.error('Error parsing sizeStock:', e);
        }
      }
      const normalizedStock =
        sizeStockArray.length > 0
          ? sizeStockArray.reduce((sum, item) => sum + item.stock, 0)
          : Number(stock) || 0;
      const normalizedStockMode = stockMode === 'apparel' || stockMode === 'shoes' ? stockMode : 'unit';

      // Insert product first to obtain its ID
      const [result]: any = await pool.query(
        'INSERT INTO products (name, description, price, category_id, stock, stock_mode, featured, colors, size_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, category, normalizedStock, normalizedStockMode, featured === 'true', JSON.stringify(colorsArray), JSON.stringify(sizeStockArray)]
      );
      const productId = result.insertId;

      // Save each image to disk (generates lg / md / sm variants)
      const imagePaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        imagePaths.push(await saveImageToDisk(productId, files[i].buffer, i + 1, imageColorsArray[i]));
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

      clearCachedByPrefix('products:');
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

      const { name, description, price, category, stock, stockMode, featured, existingImages, colors, imageColors, sizeStock } = req.body;
      const files = req.files as Express.Multer.File[];
      const productId = parseInt(req.params.id);

      // Update product fields
      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined)        { updates.push('name = ?');        values.push(name); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (price !== undefined)       { updates.push('price = ?');       values.push(price); }
      if (category !== undefined)    { updates.push('category_id = ?'); values.push(category); }
      if (featured !== undefined)    { updates.push('featured = ?');    values.push(featured === 'true'); }
      if (stockMode !== undefined)   { updates.push('stock_mode = ?');  values.push(stockMode === 'apparel' || stockMode === 'shoes' ? stockMode : 'unit'); }
      if (colors !== undefined) {
        try {
          const colorsArray = typeof colors === 'string' ? JSON.parse(colors) : colors;
          updates.push('colors = ?');
          values.push(JSON.stringify(colorsArray));
        } catch (e) {
          console.error('Error parsing colors:', e);
        }
      }
      if (sizeStock !== undefined) {
        try {
          const parsed = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
          const sizeStockArray = Array.isArray(parsed)
            ? parsed
                .map((item: any) => ({
                  size: String(item?.size || '').toUpperCase(),
                  stock: Math.max(0, parseInt(String(item?.stock ?? 0), 10) || 0),
                }))
                .filter((item) => item.size)
            : [];
          updates.push('size_stock = ?');
          values.push(JSON.stringify(sizeStockArray));
          updates.push('stock = ?');
          values.push(sizeStockArray.reduce((sum, item) => sum + item.stock, 0));
        } catch (e) {
          console.error('Error parsing sizeStock:', e);
        }
      } else if (stock !== undefined) {
        updates.push('stock = ?');
        values.push(stock);
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

      let imageColorsArray: string[] = [];
      if (imageColors) {
        try {
          const parsed = typeof imageColors === 'string' ? JSON.parse(imageColors) : imageColors;
          imageColorsArray = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Error parsing imageColors:', e);
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
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          newPaths.push(await saveImageToDisk(productId, file.buffer, nextIndex, imageColorsArray[i]));
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

      clearCachedByPrefix('products:');
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

    clearCachedByPrefix('products:');
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
