import express from 'express';
import { getCached, setCached } from '../utils/apiCache.js';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

// S3 storage access (direct via AWS SDK - hides Supabase project ID)
const s3Client = new S3Client({
  region: process.env.SUPABASE_S3_REGION || 'eu-west-1',
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || '',
    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || '',
  },
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  forcePathStyle: true,
});

const bucket = process.env.SUPABASE_S3_BUCKET || 'images-storage';

/**
 * GET /api/images/*
 * Image proxy endpoint that streams content
 *
 * Maps your domain to Supabase S3 storage
 * Hides the Supabase project ID and storage endpoint
 *
 * Usage:
 *   GET /api/images/products/28/image-1-28.webp
 *   → Streams the image from S3 through your domain
 */
router.get('/:dir/:subdir/:filename', async (req, res) => {
  try {
    const { dir, subdir, filename } = req.params;

    // Security: validate path (prevent directory traversal)
    if (dir.includes('..') || subdir.includes('..') || filename.includes('..')) {
      res.status(400).json({ error: 'Invalid path' });
      return;
    }

    // Only allow products and hero-slides directories
    if (dir !== 'products' && dir !== 'hero-slides') {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const imagePath = `${dir}/${subdir}/${filename}`;
    const cacheKey = `image-proxy:${imagePath}`;

    // Check cache for metadata (content-type, content-length)
    const cachedMeta = getCached<{ contentType: string; contentLength: number }>(cacheKey);
    if (cachedMeta) {
      res.set('X-Cache', 'HIT');
      res.set('Content-Type', cachedMeta.contentType);
      if (cachedMeta.contentLength) {
        res.set('Content-Length', cachedMeta.contentLength.toString());
      }
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year (cache busting via URL variants)
    } else {
      res.set('X-Cache', 'MISS');
      res.set('Cache-Control', 'public, max-age=31536000');
    }

    // Get object from S3
    try {
      const headCmd = new HeadObjectCommand({
        Bucket: bucket,
        Key: imagePath,
      });
      const headResult = await s3Client.send(headCmd);

      // Cache metadata for 1 hour
      if (headResult.ContentType && headResult.ContentLength) {
        setCached(cacheKey, {
          contentType: headResult.ContentType,
          contentLength: headResult.ContentLength,
        }, 3600000);
      }

      // Stream the object
      const getCmd = new GetObjectCommand({
        Bucket: bucket,
        Key: imagePath,
      });
      const getResult = await s3Client.send(getCmd);

      // Set response headers
      if (getResult.ContentType) {
        res.set('Content-Type', getResult.ContentType);
      }
      if (getResult.ContentLength) {
        res.set('Content-Length', getResult.ContentLength.toString());
      }

      // Stream to client
      if (getResult.Body) {
        try {
          // AWS SDK v3 Body is an async iterable, convert to Buffer and send
          const chunks: Buffer[] = [];
          for await (const chunk of getResult.Body as AsyncIterable<Uint8Array>) {
            chunks.push(Buffer.from(chunk));
          }
          const buffer = Buffer.concat(chunks);
          res.send(buffer);
        } catch (err) {
          console.error('❌ Stream error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Stream failed' });
          }
        }
      } else {
        res.status(500).json({ error: 'Failed to read image' });
      }
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
        res.status(404).json({ error: 'Image not found' });
      } else {
        console.error('❌ S3 read failed:', error);
        res.status(500).json({ error: 'Failed to serve image' });
      }
    }
  } catch (error) {
    console.error('❌ Image proxy failed:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

/**
 * GET /api/images/check/:dir/:subdir/:filename
 * Newsletter images — flat path: /api/images/newsletters/:filename
 */
router.get('/newsletters/:filename', async (req: any, res: any) => {
  try {
    const { filename } = req.params;
    if (filename.includes('..') || filename.includes('/')) {
      res.status(400).json({ error: 'Invalid path' });
      return;
    }
    const key = `newsletters/${filename}`;
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const s3Res = await s3Client.send(command);
    res.set('Content-Type', s3Res.ContentType || 'image/webp');
    res.set('Cache-Control', 'public, max-age=31536000');
    (s3Res.Body as any).pipe(res);
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.status(500).json({ error: 'Image error' });
    }
  }
});

/**
 * Diagnostic endpoint to verify if an image exists in S3
 * Returns: { exists: boolean, contentType, contentLength, bucket }
 */
router.get('/check/:dir/:subdir/:filename', async (req, res) => {
  try {
    const { dir, subdir, filename } = req.params;

    if (dir.includes('..') || subdir.includes('..') || filename.includes('..')) {
      res.status(400).json({ error: 'Invalid path' });
      return;
    }

    if (dir !== 'products' && dir !== 'hero-slides') {
      res.status(400).json({ error: 'Only products and hero-slides directories allowed' });
      return;
    }

    const imagePath = `${dir}/${subdir}/${filename}`;

    try {
      const headCmd = new HeadObjectCommand({
        Bucket: bucket,
        Key: imagePath,
      });
      const headResult = await s3Client.send(headCmd);

      res.json({
        imagePath,
        exists: true,
        contentType: headResult.ContentType,
        contentLength: headResult.ContentLength,
        lastModified: headResult.LastModified,
        bucket,
        endpoint: process.env.SUPABASE_S3_ENDPOINT,
      });
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
        res.json({
          imagePath,
          exists: false,
          error: 'Image not found in S3',
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Diagnostic check failed:', error);
    res.status(500).json({ error: String(error) });
  }
});

export default router;
