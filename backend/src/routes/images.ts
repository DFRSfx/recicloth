import express from 'express';
import { getCached, setCached } from '../utils/apiCache.js';

const router = express.Router();

// Supabase public storage base URL (configurable via environment)
const SUPABASE_PUBLIC_URL = process.env.SUPABASE_PUBLIC_STORAGE_URL ||
  'https://orekmrlxkpuymngiphzf.supabase.co/storage/v1/object/public/images-storage';

/**
 * GET /api/images/*
 * Image proxy/redirect endpoint
 *
 * Maps your domain to Supabase public storage
 * Hides the actual S3 URL from clients
 *
 * Usage:
 *   /api/images/products/28/image-1-28.webp
 *   → https://orekmrlxkpuymngiphzf.supabase.co/storage/v1/object/public/images-storage/products/28/image-1-28.webp
 */
router.get('/:dir/:subdir/:filename', async (req, res) => {
  try {
    const { dir, subdir, filename } = req.params;

    // Security: validate path (prevent directory traversal)
    if (dir.includes('..') || subdir.includes('..') || filename.includes('..')) {
      res.status(400).json({ error: 'Invalid path' });
      return;
    }

    // Only allow products directory for now
    if (dir !== 'products') {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const imagePath = `${dir}/${subdir}/${filename}`;
    const cacheKey = `image-proxy:${imagePath}`;

    // Check cache
    const cached = getCached<{ url: string }>(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.redirect(301, cached.url);
    }

    // Construct S3 URL
    const s3Url = `${SUPABASE_PUBLIC_URL}/${imagePath}`;

    // Verify image exists with HEAD request (no caching needed)
    try {
      const headResponse = await fetch(s3Url, { method: 'HEAD' });
      if (!headResponse.ok) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }
    } catch (error) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    // Cache the URL for 1 hour
    setCached(cacheKey, { url: s3Url }, 3600000);

    res.set('X-Cache', 'MISS');
    // Redirect to actual S3 URL (301 = permanent redirect, cached by browser)
    res.redirect(301, s3Url);
  } catch (error) {
    console.error('❌ Image proxy failed:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

export default router;
