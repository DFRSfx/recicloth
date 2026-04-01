import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import { getCached, setCached, clearCachedByPrefix } from '../utils/apiCache.js';
import { saveCategoryTranslations } from '../utils/saveTranslations.js';

const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const lang = (req.query.lang as string) || 'pt'; // 🌍 i18n
    const cacheKey = `categories:list:${lang}`;       // 🌍 cache por língua
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    // 🌍 JOIN com tabela de tradução
    const [rows]: any = await pool.query(
      `SELECT
         c.id, c.slug, c.image, c.created_at,
         COALESCE(ct.name,        c.name)        AS name,
         COALESCE(ct.description, c.description) AS description
       FROM categories c
       LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.lang = ?
       ORDER BY c.name ASC`,
      [lang]
    );

    setCached(cacheKey, rows, 60_000);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.setHeader('X-Cache', 'MISS');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category (public)
router.get('/:id', async (req, res) => {
  try {
    const lang = (req.query.lang as string) || 'pt'; // 🌍 i18n

    const [rows]: any = await pool.query(
      `SELECT
         c.id, c.slug, c.image, c.created_at,
         COALESCE(ct.name,        c.name)        AS name,
         COALESCE(ct.description, c.description) AS description
       FROM categories c
       LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.lang = ?
       WHERE c.id = ?`,
      [lang, req.params.id]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category (admin only)
router.post(
  '/',
  ...requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').optional().trim(),
    body('description').optional().trim(),
    body('image').optional().trim()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, description, image } = req.body;
      const slug = req.body.slug?.trim() ||
        name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');

      const [result]: any = await pool.query(
        'INSERT INTO categories (name, slug, description, image) VALUES (?, ?, ?, ?)',
        [name, slug, description || null, image || null]
      );

      const [newCategory]: any = await pool.query(
        'SELECT * FROM categories WHERE id = ?',
        [result.insertId]
      );

      clearCachedByPrefix('categories:');

      // 🌍 i18n: Guarda traduções (ambas línguas) antes de responder
      await saveCategoryTranslations(result.insertId, name, description || null);

      res.status(201).json(newCategory[0]);
    } catch (error: any) {
      console.error('Error creating category:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Category name or slug already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

// Update category (admin only)
router.put(
  '/:id',
  ...requireAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('image').optional().trim()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, slug, description, image } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (slug !== undefined) {
        updates.push('slug = ?');
        values.push(slug);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (image !== undefined) {
        updates.push('image = ?');
        values.push(image);
      }

      if (updates.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      values.push(req.params.id);

      await pool.query(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const [updatedCategory]: any = await pool.query(
        'SELECT * FROM categories WHERE id = ?',
        [req.params.id]
      );

      if (updatedCategory.length === 0) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      clearCachedByPrefix('categories:');

      // 🌍 i18n: Re-traduz se name ou description mudaram
      if (name !== undefined || description !== undefined) {
        const currentName = name ?? updatedCategory[0].name;
        const currentDesc = description !== undefined ? description : updatedCategory[0].description;
        saveCategoryTranslations(
          Number(req.params.id),
          currentName,
          currentDesc || null
        ).catch(console.error);
      }

      res.json(updatedCategory[0]);
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Category name or slug already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
);

// Delete category (admin only)
router.delete('/:id', ...requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [result]: any = await pool.query(
      'DELETE FROM categories WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    clearCachedByPrefix('categories:');
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
