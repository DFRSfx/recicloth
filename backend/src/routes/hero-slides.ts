import express from 'express';
import pool from '../config/database.js';
import { requireAdmin } from '../middleware/auth.js';
import { upload } from '../config/upload.js';
import { getCached, setCached, clearCachedByPrefix } from '../utils/apiCache.js';
import { uploadToS3 } from '../utils/s3Upload.js';

const router = express.Router();

const HERO_VARIANTS = [
  { variant: 'lg', suffix: '',    width: 1920, height: 1080, quality: 85 },
  { variant: 'md', suffix: '-md', width: 1280, height: 720,  quality: 75 },
  { variant: 'sm', suffix: '-sm', width: 800,  height: 450,  quality: 68 },
] as const;

function getSlideUrls(id: number | string, updatedAt: Date | string) {
  const ts = new Date(updatedAt).getTime();
  return {
    background_image:    `/hero-slides/${id}/heroslide-${id}.webp?v=${ts}`,
    background_image_md: `/hero-slides/${id}/heroslide-${id}-md.webp?v=${ts}`,
    background_image_sm: `/hero-slides/${id}/heroslide-${id}-sm.webp?v=${ts}`,
  };
}

async function processAndUploadSlideImage(id: number | string, buffer: Buffer): Promise<void> {
  const { default: sharp } = await import('sharp');
  const opts = { effort: 6, smartSubsample: true };

  try {
    const lgBuffer = await sharp(buffer)
      .resize(1920, 1080, { fit: 'cover', position: 'center' })
      .webp({ quality: 85, ...opts })
      .toBuffer();

    const mdBuffer = await sharp(buffer)
      .resize(1280, 720, { fit: 'cover', position: 'center' })
      .webp({ quality: 75, ...opts })
      .toBuffer();

    const smBuffer = await sharp(buffer)
      .resize(800, 450, { fit: 'cover', position: 'center' })
      .webp({ quality: 68, ...opts })
      .toBuffer();

    await Promise.all([
      uploadToS3(lgBuffer, `hero-slides/${id}/heroslide-${id}.webp`),
      uploadToS3(mdBuffer, `hero-slides/${id}/heroslide-${id}-md.webp`),
      uploadToS3(smBuffer, `hero-slides/${id}/heroslide-${id}-sm.webp`),
    ]);

    console.log(`✅ Hero slide ${id} uploaded to S3 with all variants`);
  } catch (error) {
    console.error('❌ Hero slide image processing/upload failed:', error);
    throw error;
  }
}

const SLIDE_SELECT = `
  id, title, title_pt, title_en,
  description, description_pt, description_en,
  button_text, button_text_pt, button_text_en,
  button_link, text_color, display_order, is_active, created_at, updated_at
`;

interface HeroSlide {
  id: number;
  title: string;
  title_pt?: string | null;
  title_en?: string | null;
  description?: string | null;
  description_pt?: string | null;
  description_en?: string | null;
  button_text: string;
  button_text_pt?: string | null;
  button_text_en?: string | null;
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
    const cacheKey = 'hero-slides:active';
    const cached = getCached<any[]>(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const [slidesResult] = await pool.query<HeroSlide>(
      `SELECT ${SLIDE_SELECT} FROM hero_slides WHERE is_active = TRUE ORDER BY display_order ASC`
    );
    const slides = Array.isArray(slidesResult) ? slidesResult : (slidesResult.rows as HeroSlide[]);

    const slidesWithImages = slides.map(slide => ({
      ...slide,
      ...getSlideUrls(slide.id, slide.updated_at),
    }));

    setCached(cacheKey, slidesWithImages, 60_000);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.setHeader('X-Cache', 'MISS');
    res.json(slidesWithImages);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

// Get all slides including inactive (admin only)
router.get('/all', ...requireAdmin, async (req, res) => {
  try {
    const [slidesResult] = await pool.query<HeroSlide>(
      `SELECT ${SLIDE_SELECT} FROM hero_slides ORDER BY display_order ASC`
    );
    const slides = Array.isArray(slidesResult) ? slidesResult : (slidesResult.rows as HeroSlide[]);

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
    const [slidesResult] = await pool.query<HeroSlide>(
      `SELECT ${SLIDE_SELECT} FROM hero_slides WHERE id = ?`,
      [req.params.id]
    );
    const slides = Array.isArray(slidesResult) ? slidesResult : (slidesResult.rows as HeroSlide[]);

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
      title_pt, title_en,
      description, description_pt, description_en,
      button_text, button_text_pt, button_text_en,
      button_link,
      text_color = 'white',
      display_order = 0,
      is_active = 'true'
    } = req.body;

    if (!title || !button_text || !button_link || !req.file) {
      return res.status(400).json({ error: 'Missing required fields or image' });
    }

    const [result]: any = await pool.query(
      `INSERT INTO hero_slides
         (title, title_pt, title_en,
          description, description_pt, description_en,
          button_text, button_text_pt, button_text_en,
          button_link, text_color, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, title_pt || null, title_en || null,
        description || null, description_pt || null, description_en || null,
        button_text, button_text_pt || null, button_text_en || null,
        button_link, text_color, display_order, is_active === 'true'
      ]
    );

    const id = result.insertId;
    await processAndUploadSlideImage(id, req.file.buffer);

    const [newSlideResult] = await pool.query<HeroSlide>(
      `SELECT ${SLIDE_SELECT} FROM hero_slides WHERE id = ?`, [id]
    );
    const newSlide = Array.isArray(newSlideResult) ? newSlideResult : (newSlideResult.rows as HeroSlide[]);

    clearCachedByPrefix('hero-slides:');
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
      title, title_pt, title_en,
      description, description_pt, description_en,
      button_text, button_text_pt, button_text_en,
      button_link, text_color, display_order, is_active
    } = req.body;

    const [result]: any = await pool.query(
      `UPDATE hero_slides
       SET title = ?, title_pt = ?, title_en = ?,
           description = ?, description_pt = ?, description_en = ?,
           button_text = ?, button_text_pt = ?, button_text_en = ?,
           button_link = ?, text_color = ?, display_order = ?, is_active = ?
       WHERE id = ?`,
      [
        title, title_pt || null, title_en || null,
        description || null, description_pt || null, description_en || null,
        button_text, button_text_pt || null, button_text_en || null,
        button_link, text_color, display_order,
        is_active === 'true' || is_active === true,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    if (req.file) {
      await processAndUploadSlideImage(req.params.id, req.file.buffer);
    }

    const [updatedSlideResult] = await pool.query<HeroSlide>(
      `SELECT ${SLIDE_SELECT} FROM hero_slides WHERE id = ?`, [req.params.id]
    );
    const updatedSlide = Array.isArray(updatedSlideResult)
      ? updatedSlideResult
      : (updatedSlideResult.rows as HeroSlide[]);

    clearCachedByPrefix('hero-slides:');
    res.json({ ...updatedSlide[0], ...getSlideUrls(req.params.id, updatedSlide[0].updated_at) });
  } catch (error) {
    console.error('Error updating hero slide:', error);
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

// Delete slide (admin only)
router.delete('/:id', ...requireAdmin, async (req, res) => {
  try {
    const [result]: any = await pool.query(
      'DELETE FROM hero_slides WHERE id = ?', [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    clearCachedByPrefix('hero-slides:');
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

    clearCachedByPrefix('hero-slides:');
    res.json({ message: 'Slides reordered successfully' });
  } catch (error) {
    console.error('Error reordering slides:', error);
    res.status(500).json({ error: 'Failed to reorder slides' });
  }
});

export default router;
