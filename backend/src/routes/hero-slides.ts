import express from 'express';
import pool from '../config/database.js';
import { requireAdmin } from '../middleware/auth.js';
import { upload } from '../config/upload.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const heroSlidesDir = path.join(__dirname, '../../public/hero-slides');

const HERO_VARIANTS = [
  { variant: 'lg', suffix: '',    width: 1920, height: 1080, quality: 85 },
  { variant: 'md', suffix: '-md', width: 1280, height: 720,  quality: 75 },
  { variant: 'sm', suffix: '-sm', width: 800,  height: 450,  quality: 68 },
] as const;

function getSlidePath(id: number | string, suffix: string = ''): string {
  return path.join(heroSlidesDir, `heroslide-${id}${suffix}.webp`);
}

function getSlideUrls(id: number | string, updatedAt: Date | string) {
  const ts = new Date(updatedAt).getTime();
  return {
    background_image:    `/hero-slides/heroslide-${id}.webp?v=${ts}`,
    background_image_md: `/hero-slides/heroslide-${id}-md.webp?v=${ts}`,
    background_image_sm: `/hero-slides/heroslide-${id}-sm.webp?v=${ts}`,
  };
}

async function saveSlideImages(id: number | string, buffer: Buffer): Promise<void> {
  fs.mkdirSync(heroSlidesDir, { recursive: true });
  const opts = { effort: 6, smartSubsample: true };
  await Promise.all(
    HERO_VARIANTS.map(({ suffix, width, height, quality }) =>
      sharp(buffer)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .webp({ quality, ...opts })
        .toFile(getSlidePath(id, suffix))
    )
  );
}

interface HeroSlide {
  id: number;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  text_color: 'white' | 'dark';
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Get all active slides (public)
router.get('/', async (req, res) => {
  try {
    const [slides] = await pool.query<HeroSlide[]>(
      'SELECT id, title, description, button_text, button_link, text_color, display_order, is_active, created_at, updated_at FROM hero_slides WHERE is_active = TRUE ORDER BY display_order ASC'
    );

    const slidesWithImages = slides.map(slide => ({
      ...slide,
      ...getSlideUrls(slide.id, slide.updated_at),
    }));

    res.json(slidesWithImages);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

// Get all slides including inactive (admin only)
router.get('/all', ...requireAdmin, async (req, res) => {
  try {
    const [slides] = await pool.query<HeroSlide[]>(
      'SELECT id, title, description, button_text, button_link, text_color, display_order, is_active, created_at, updated_at FROM hero_slides ORDER BY display_order ASC'
    );

    const slidesWithImages = slides.map(slide => ({
      ...slide,
      ...getSlideUrls(slide.id, slide.updated_at),
    }));

    res.json(slidesWithImages);
  } catch (error) {
    console.error('Error fetching all hero slides:', error);
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

// Get single slide
router.get('/:id', async (req, res) => {
  try {
    const [slides] = await pool.query<HeroSlide[]>(
      'SELECT id, title, description, button_text, button_link, text_color, display_order, is_active, created_at, updated_at FROM hero_slides WHERE id = ?',
      [req.params.id]
    );

    if (slides.length === 0) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    const slide = slides[0];
    res.json({ ...slide, ...getSlideUrls(slide.id, slide.updated_at) });
  } catch (error) {
    console.error('Error fetching hero slide:', error);
    res.status(500).json({ error: 'Failed to fetch slide' });
  }
});

// Create new slide (admin only)
router.post('/', ...requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      button_text,
      button_link,
      text_color = 'white',
      display_order = 0,
      is_active = 'true'
    } = req.body;

    if (!title || !button_text || !button_link || !req.file) {
      return res.status(400).json({ error: 'Missing required fields or image' });
    }

    const [result]: any = await pool.query(
      `INSERT INTO hero_slides (title, description, button_text, button_link, text_color, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, button_text, button_link, text_color, display_order, is_active === 'true']
    );

    const id = result.insertId;

    // Save all size variants to disk
    await saveSlideImages(id, req.file.buffer);

    const [newSlide] = await pool.query<HeroSlide[]>(
      'SELECT id, title, description, button_text, button_link, text_color, display_order, is_active, created_at, updated_at FROM hero_slides WHERE id = ?',
      [id]
    );

    res.status(201).json({ ...newSlide[0], ...getSlideUrls(id, newSlide[0].updated_at) });
  } catch (error) {
    console.error('Error creating hero slide:', error);
    res.status(500).json({ error: 'Failed to create slide' });
  }
});

// Update slide (admin only)
router.put('/:id', ...requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      button_text,
      button_link,
      text_color,
      display_order,
      is_active
    } = req.body;

    const [result]: any = await pool.query(
      `UPDATE hero_slides
       SET title = ?, description = ?, button_text = ?, button_link = ?,
           text_color = ?, display_order = ?, is_active = ?
       WHERE id = ?`,
      [title, description, button_text, button_link, text_color, display_order,
       is_active === 'true' || is_active === true, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    // Overwrite all size variants on disk if a new image was uploaded
    if (req.file) {
      await saveSlideImages(req.params.id, req.file.buffer);
    }

    const [updatedSlide] = await pool.query<HeroSlide[]>(
      'SELECT id, title, description, button_text, button_link, text_color, display_order, is_active, created_at, updated_at FROM hero_slides WHERE id = ?',
      [req.params.id]
    );

    res.json({
      ...updatedSlide[0],
      ...getSlideUrls(req.params.id, updatedSlide[0].updated_at)
    });
  } catch (error) {
    console.error('Error updating hero slide:', error);
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

// Delete slide (admin only)
router.delete('/:id', ...requireAdmin, async (req, res) => {
  try {
    const [result]: any = await pool.query(
      'DELETE FROM hero_slides WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    // Remove all size variants from disk
    for (const { suffix } of HERO_VARIANTS) {
      const filePath = getSlidePath(req.params.id, suffix);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: 'Slide deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    res.status(500).json({ error: 'Failed to delete slide' });
  }
});

// Reorder slides (admin only)
router.post('/reorder', ...requireAdmin, async (req, res) => {
  try {
    const { slides } = req.body;

    if (!Array.isArray(slides)) {
      return res.status(400).json({ error: 'Invalid slides array' });
    }

    for (const slide of slides) {
      await pool.query(
        'UPDATE hero_slides SET display_order = ? WHERE id = ?',
        [slide.display_order, slide.id]
      );
    }

    res.json({ message: 'Slides reordered successfully' });
  } catch (error) {
    console.error('Error reordering slides:', error);
    res.status(500).json({ error: 'Failed to reorder slides' });
  }
});

export default router;
