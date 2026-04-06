import express from 'express';
import pool from '../config/database.js';
import { requireAdmin, AuthRequest, authenticateToken, optionalAuth } from '../middleware/auth.js';
import { upload } from '../config/upload.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getCached, setCached, clearCachedByPrefix } from '../utils/apiCache.js';
import { warmCaches } from '../utils/dataWarmer.js';
import { uploadToS3, deleteFromS3 } from '../utils/s3Upload.js';
import { saveProductTranslations, saveColorTranslations } from '../utils/saveTranslations.js';

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

const processAndUploadImage = async (
  productId: number,
  buffer: Buffer,
  index: number,
  colorName?: string
): Promise<string> => {
  const { default: sharp } = await import('sharp');

  const colorSlug = toColorSlug(colorName);
  const base = colorSlug
    ? `image-${index}-${productId}-${colorSlug}`
    : `image-${index}-${productId}`;
  const opts = { effort: 6, smartSubsample: true };

  try {
    // Generate all 3 versions for optimal performance
    // lg — product detail page (max 1200 px, quality 85)
    const lgBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, ...opts })
      .toBuffer();

    // md — shop grid (max 600 px, quality 82)
    const mdBuffer = await sharp(buffer)
      .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, ...opts })
      .toBuffer();

    // sm — admin / cart thumbnails (max 280 px, quality 75)
    const smBuffer = await sharp(buffer)
      .resize(280, 280, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75, ...opts })
      .toBuffer();

    // Upload all 3 versions to S3 in parallel
    const s3KeyLg = `products/${productId}/${base}.webp`;
    const s3KeyMd = `products/${productId}/${base}-md.webp`;
    const s3KeySm = `products/${productId}/${base}-sm.webp`;

    const [lgUrl] = await Promise.all([
      uploadToS3(lgBuffer, s3KeyLg),
      uploadToS3(mdBuffer, s3KeyMd),
      uploadToS3(smBuffer, s3KeySm),
    ]);

    // Return the main (lg) URL — frontend will use -md and -sm variants
    return lgUrl;
  } catch (error) {
    console.error('❌ Image processing/upload failed:', error);
    // Fallback to placeholder on any error
    const placeholderUrl = `https://picsum.photos/seed/recicloth-${productId}-${index}/800/800?random=${Date.now()}`;
    console.warn(`⚠️ Using placeholder: ${placeholderUrl}`);
    return placeholderUrl;
  }
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

// ── Reviews (admin moderation) ───────────────────────────────────────────────

router.get('/reviews', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const allowed = ['pending', 'approved', 'rejected'];
    if (status && !allowed.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const whereClause = status ? 'WHERE r.status = ?' : '';
    const params = status ? [status] : [];

    const [rows]: any = await pool.query(
      `SELECT
         r.id, r.product_id, r.order_id, r.order_item_id, r.user_id,
         r.reviewer_name, r.reviewer_email, r.rating, r.headline, r.content,
         r.size, r.color, r.fit, r.height, r.likelihood, r.activities,
         r.status, r.admin_notes, r.created_at,
         p.name AS product_name
       FROM product_reviews r
       JOIN products p ON r.product_id = p.id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/reviews/pending', ...requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT
         r.id, r.product_id, r.order_id, r.order_item_id, r.user_id,
         r.reviewer_name, r.reviewer_email, r.rating, r.headline, r.content,
         r.size, r.color, r.fit, r.height, r.likelihood, r.activities,
         r.status, r.admin_notes, r.created_at,
         p.name AS product_name
       FROM product_reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
});

router.patch('/reviews/:reviewId', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    const { status, admin_notes } = req.body || {};
    if (!reviewId || Number.isNaN(reviewId)) {
      res.status(400).json({ error: 'Invalid review id' });
      return;
    }
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const [result]: any = await pool.execute(
      `UPDATE product_reviews
       SET status = ?, admin_notes = ?, moderated_by = ?, moderated_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [status, admin_notes || null, req.user?.id || null, reviewId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

router.delete('/reviews/:reviewId', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    if (!reviewId || Number.isNaN(reviewId)) {
      res.status(400).json({ error: 'Invalid review id' });
      return;
    }

    const [result]: any = await pool.execute(
      'DELETE FROM product_reviews WHERE id = ?',
      [reviewId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ── Reviews (public + authenticated) ─────────────────────────────────────────

router.get('/:id/reviews', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.params.id);
    if (!productId || Number.isNaN(productId)) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }

    const userId = req.user?.id;
    const includePending = Boolean(userId);
    const [rows]: any = await pool.query(
      `SELECT
         id, rating, headline, content, reviewer_name,
         size, color, fit, height, likelihood, activities, created_at, status
       FROM product_reviews
       WHERE product_id = ?
         AND (
           status = 'approved'
           ${includePending ? 'OR (status = \'pending\' AND user_id = ?)' : ''}
         )
       ORDER BY created_at DESC`,
      includePending ? [productId, userId] : [productId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.get('/:id/reviews/eligible', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.params.id);
    const userId = req.user?.id;
    if (!productId || Number.isNaN(productId)) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const [rows]: any = await pool.query(
      `SELECT
         oi.id AS order_item_id,
         o.id AS order_id,
         o.created_at,
         oi.size,
         oi.color
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN product_reviews r ON r.order_item_id = oi.id
       WHERE oi.product_id = ?
         AND o.user_id = ?
         AND o.payment_status = 'paid'
         AND o.status <> 'cancelled'
         AND r.id IS NULL
       ORDER BY o.created_at DESC`,
      [productId, userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching eligible review items:', error);
    res.status(500).json({ error: 'Failed to fetch eligible reviews' });
  }
});

router.post('/:id/reviews', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.params.id);
    const userId = req.user?.id;
    const {
      order_item_id,
      rating,
      headline,
      content,
      fit,
      height,
      likelihood,
      activities,
      reviewer_name,
    } = req.body || {};

    if (!productId || Number.isNaN(productId)) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!order_item_id || Number.isNaN(Number(order_item_id))) {
      res.status(400).json({ error: 'Order item is required' });
      return;
    }
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }
    if (!headline || !String(headline).trim()) {
      res.status(400).json({ error: 'Headline is required' });
      return;
    }
    if (!content || !String(content).trim()) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const [rows]: any = await pool.query(
      `SELECT
         oi.id,
         oi.order_id,
         oi.size,
         oi.color,
         o.user_id,
         o.payment_status,
         o.status
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.id = ? AND oi.product_id = ? AND o.user_id = ?`,
      [order_item_id, productId, userId]
    );

    if (rows.length === 0) {
      res.status(403).json({ error: 'Order item not eligible for review' });
      return;
    }

    const orderItem = rows[0];
    if (orderItem.payment_status !== 'paid' || orderItem.status === 'cancelled') {
      res.status(403).json({ error: 'Only paid orders can be reviewed' });
      return;
    }

    const [existing]: any = await pool.query(
      'SELECT id FROM product_reviews WHERE order_item_id = ?',
      [order_item_id]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: 'Review already exists for this order item' });
      return;
    }

    const safeName = String(reviewer_name || req.user?.name || 'Cliente').trim();
    const normalizedActivities = Array.isArray(activities)
      ? activities.filter(Boolean).map((a: any) => String(a).trim()).filter(Boolean).join(', ')
      : (activities ? String(activities).trim() : null);
    const normalizedFit = fit ? String(fit).trim() : null;
    const normalizedHeight = height ? String(height).trim() : null;
    const normalizedLikelihood = likelihood ? String(likelihood).trim() : null;

    const [insertResult]: any = await pool.execute(
      `INSERT INTO product_reviews (
         product_id, order_id, order_item_id, user_id,
         reviewer_name, reviewer_email, rating, headline, content,
         size, color, fit, height, likelihood, activities,
         status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        orderItem.order_id,
        order_item_id,
        userId,
        safeName,
        req.user?.email || '',
        numericRating,
        String(headline).trim(),
        String(content).trim(),
        orderItem.size || null,
        orderItem.color || null,
        normalizedFit,
        normalizedHeight,
        normalizedLikelihood,
        normalizedActivities,
        'pending',
      ]
    );

    res.status(201).json({ success: true, id: insertResult.insertId, status: 'pending' });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// 🌍 i18n: Substitui os nomes das cores pelo valor traduzido para o lang pedido
async function applyColorTranslations(
  products: any[],
  lang: string
): Promise<any[]> {
  if (!products.length) return products;

  const productIdsWithColors = products
    .filter(p => Array.isArray(p.colors) && p.colors.length > 0)
    .map(p => Number(p.id));

  if (!productIdsWithColors.length) return products;

  // Build IN clause with correct number of placeholders
  const placeholders = productIdsWithColors.map(() => '?').join(', ');
  const [colorRows]: any = await pool.query(
    `SELECT product_id, hex, name
     FROM color_translations
     WHERE product_id IN (${placeholders}) AND lang = ?`,
    [...productIdsWithColors, lang]
  );

  // Agrupa por product_id → hex → name
  const colorMap: Record<number, Record<string, string>> = {};
  for (const row of colorRows) {
    if (!colorMap[row.product_id]) colorMap[row.product_id] = {};
    colorMap[row.product_id][row.hex] = row.name;
  }

  return products.map(p => {
    if (!Array.isArray(p.colors) || !colorMap[p.id]) return p;
    return {
      ...p,
      colors: p.colors.map((c: any) => ({
        ...c,
        name: colorMap[p.id]?.[c.hex] ?? c.name, // fallback ao nome original
        original_name: c.name, // 🌍 Keep original English name for admin slug-matching
      })),
    };
  });
}

// ── GET all products (public) ─────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    // Lazy cache warming on first request (prevents startup connection exhaustion on serverless)
    warmCaches().catch(err => console.error('Lazy cache warm failed:', err));

    const lang = (req.query.lang as string) || 'pt'; // 🌍 i18n
    const cacheKey = `products:list:${lang}`;         // 🌍 cache por língua
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    // 🌍 JOIN com tabelas de tradução — COALESCE garante fallback ao original
    const [rows]: any = await pool.query(
      `SELECT
         p.id, p.price, p.weight, p.stock, p.stock_mode, p.size_stock,
         p.featured, p.images, p.colors, p.created_at, p.updated_at,
         p.category_id,
         COALESCE(pt.name,        p.name)        AS name,
         COALESCE(pt.description, p.description) AS description,
         COALESCE(ct.name,        c.name)        AS category_name,
         c.slug                                  AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_translations pt  ON pt.product_id  = p.id  AND pt.lang  = ?
       LEFT JOIN category_translations ct ON ct.category_id = c.id  AND ct.lang  = ?
       ORDER BY p.created_at DESC`,
      [lang, lang]
    );

    let products = rows.map((p: any) => ({ ...p, images: parseImages(p.images) }));
    products = await applyColorTranslations(products, lang); // 🌍 i18n cores

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
    const raw = req.query.raw === 'true';
    const lang = (req.query.lang as string) || 'pt'; // 🌍 i18n

    if (raw) {
      const [rows]: any = await pool.query(
        `SELECT
           p.*,
           c.name AS category_name,
           c.slug AS category_slug
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`,
        [req.params.id]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      let parsedColors = [];
      try {
        parsedColors = typeof rows[0].colors === 'string' ? JSON.parse(rows[0].colors) : rows[0].colors;
      } catch (e) {
        // ignore
      }

      const product = { 
        ...rows[0], 
        images: parseImages(rows[0].images),
        colors: parsedColors
      };
      
      res.json(product);
      return;
    }

    // 🌍 JOIN com tabelas de tradução
    const [rows]: any = await pool.query(
      `SELECT
         p.id, p.price, p.weight, p.stock, p.stock_mode, p.size_stock,
         p.featured, p.images, p.colors, p.created_at, p.updated_at,
         p.category_id,
         COALESCE(pt.name,        p.name)        AS name,
         COALESCE(pt.description, p.description) AS description,
         COALESCE(ct.name,        c.name)        AS category_name,
         c.slug                                  AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_translations pt  ON pt.product_id  = p.id  AND pt.lang  = ?
       LEFT JOIN category_translations ct ON ct.category_id = c.id  AND ct.lang  = ?
       WHERE p.id = ?`,
      [lang, lang, req.params.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    let products = [{ ...rows[0], images: parseImages(rows[0].images) }];
    products = await applyColorTranslations(products, lang); // 🌍 i18n cores
    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ── GET /:id/translations (admin) ───────────────────────────────────────────

router.get('/:id/translations', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Fetch product translations
    const [ptRows]: any = await pool.query(
      'SELECT lang, name, description FROM product_translations WHERE product_id = ?',
      [productId]
    );

    // Fetch color translations
    const [ctRows]: any = await pool.query(
      'SELECT hex, lang, name FROM color_translations WHERE product_id = ?',
      [productId]
    );

    // Group by language
    const translations: Record<string, { name: string; description: string; colors: { hex: string; name: string }[] }> = {};
    for (const row of ptRows) {
      translations[row.lang] = {
        name: row.name,
        description: row.description,
        colors: [],
      };
    }

    for (const row of ctRows) {
      if (!translations[row.lang]) {
        translations[row.lang] = { name: '', description: '', colors: [] };
      }
      translations[row.lang].colors.push({ hex: row.hex, name: row.name });
    }

    res.json(translations);
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// ── PUT /:id/translations (admin) ───────────────────────────────────────────

router.put('/:id/translations', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { translations } = req.body; 
    // Format expected: { [lang]: { name, description, colors: [{hex, name}] } }

    if (!translations || typeof translations !== 'object') {
       res.status(400).json({ error: 'Missing translations object' });
       return;
    }

    // Process each language
    for (const [lang, data] of Object.entries(translations)) {
      const { name, description, colors } = data as any;

      if (name !== undefined || description !== undefined) {
        await pool.query(
          `INSERT INTO product_translations (product_id, lang, name, description)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (product_id, lang) DO UPDATE
             SET name = EXCLUDED.name, description = EXCLUDED.description`,
          [productId, lang, name || '', description || '']
        );
      }

      if (Array.isArray(colors)) {
        for (const color of colors) {
          if (!color.hex || !color.name) continue;
          await pool.query(
            `INSERT INTO color_translations (product_id, hex, lang, name)
             VALUES (?, ?, ?, ?)
             ON CONFLICT (product_id, hex, lang) DO UPDATE SET name = EXCLUDED.name`,
            [productId, color.hex, lang, color.name]
          );
        }
      }
    }

    clearCachedByPrefix('products:');
    res.json({ message: 'Translations updated successfully' });
  } catch (error) {
    console.error('Error updating translations:', error);
    res.status(500).json({ error: 'Failed to update translations' });
  }
});

// ── POST / — Create product (admin) ──────────────────────────────────────────

router.post(
  '/',
  ...requireAdmin,
  upload.array('images', 10),
  async (req: AuthRequest, res) => {
    try {
      const { name, description, price, weight, category, stock, stockMode, featured, colors, imageColors, sizeStock } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!name || !description || !price || !category) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (weight && (Number(weight) <= 0 || !Number.isInteger(Number(weight)))) {
        res.status(400).json({ error: 'Weight must be a positive integer (in grams)' });
        return;
      }

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'At least one image is required' });
        return;
      }

      let colorsArray: any[] = [];
      if (colors) {
        try {
          colorsArray = typeof colors === 'string' ? JSON.parse(colors) : colors;
        } catch (e) {
          console.error('Error parsing colors:', e);
        }
      }

      // Parse image color selections (used to encode color in filename)
      let imageColorsArray: string[] = [];
      if (imageColors) {
        try {
          const parsed = typeof imageColors === 'string' ? JSON.parse(imageColors) : imageColors;
          imageColorsArray = Array.isArray(parsed)
            ? parsed.map((item: any) => (typeof item === 'string' ? item : item.name || ''))
            : [];
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
        'INSERT INTO products (name, description, price, weight, category_id, stock, stock_mode, featured, colors, size_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, weight ? Number(weight) : null, category, normalizedStock, normalizedStockMode, featured === 'true', JSON.stringify(colorsArray), JSON.stringify(sizeStockArray)]
      );
      const productId = result.insertId;

      // Save each image to disk (generates lg / md / sm variants)
      // Colors are encoded in filename during upload (e.g., image-1-28-preto.webp)
      const imagePaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        imagePaths.push(await processAndUploadImage(productId, files[i].buffer, i + 1, imageColorsArray[i]));
      }

      // Store image paths in products table
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

      // 🌍 i18n: Guarda traduções em background (não atrasa a resposta ao admin)
      saveProductTranslations(productId, name, description, 'en').catch(console.error);
      if (colorsArray.length > 0) {
        saveColorTranslations(productId, colorsArray, 'en').catch(console.error);
      }

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

      const { name, description, price, weight, category, stock, stockMode, featured, existingImages, colors, imageColors, sizeStock } = req.body;
      const files = req.files as Express.Multer.File[];
      const productId = parseInt(req.params.id);

      if (weight && (Number(weight) <= 0 || !Number.isInteger(Number(weight)))) {
        res.status(400).json({ error: 'Weight must be a positive integer (in grams)' });
        return;
      }

      // Update product fields
      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined)        { updates.push('name = ?');        values.push(name); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (price !== undefined)       { updates.push('price = ?');       values.push(price); }
      if (weight !== undefined)      { updates.push('weight = ?');      values.push(weight ? Number(weight) : null); }
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
          values.push(
            sizeStockArray.length > 0
              ? sizeStockArray.reduce((sum, item) => sum + item.stock, 0)
              : Number(stock) || 0
          );
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

      // Parse image color selections for new files (used to encode color in filename)
      let imageColorsArray: string[] = [];
      if (imageColors) {
        try {
          const parsed = typeof imageColors === 'string' ? JSON.parse(imageColors) : imageColors;
          imageColorsArray = Array.isArray(parsed)
            ? parsed.map((item: any) => (typeof item === 'string' ? item : item.name || ''))
            : [];
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
          newPaths.push(await processAndUploadImage(productId, file.buffer, nextIndex, imageColorsArray[i]));
          nextIndex++;
        }
      }

      // Final order: existing (in admin's order) + newly uploaded
      const finalImages = [...keepPaths, ...newPaths];

      // Update only images (colors are encoded in filenames, no separate storage needed)
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

      // 🌍 i18n: Re-traduz se name, description ou colors foram alterados
      if (name !== undefined || description !== undefined) {
        const currentName = name ?? updatedProduct[0].name;
        const currentDesc = description ?? updatedProduct[0].description;
        saveProductTranslations(productId, currentName, currentDesc, 'en').catch(console.error);
      }
      if (colors !== undefined) {
        try {
          const colorsForTranslation = typeof colors === 'string' ? JSON.parse(colors) : colors;
          if (Array.isArray(colorsForTranslation) && colorsForTranslation.length > 0) {
            saveColorTranslations(productId, colorsForTranslation, 'en').catch(console.error);
          }
        } catch (e) { /* já validado acima */ }
      }

      res.json({ ...updatedProduct[0], images: finalImages });
    } catch (error) {
      console.error('❌ Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product', details: String(error) });
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
