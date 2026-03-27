import pool from '../config/database.js';
import { setCached } from './apiCache.js';

const parseImages = (images: any): string[] => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      return JSON.parse(images);
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Warm up critical caches on server startup.
 * This preloads the most-accessed data to avoid cold starts.
 */
export async function warmCaches() {
  try {
    const startTime = Date.now();

    // 1. Preload products with categories (heaviest query, ~500ms on cold start)
    const [products]: any = await pool.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);

    const formattedProducts = (products || []).map((product: any) => ({
      ...product,
      images: parseImages(product.images),
    }));

    setCached('products:list', formattedProducts, 60_000);

    // 2. Preload categories (lightweight, frequently accessed in navigation)
    const [categories]: any = await pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );

    setCached('categories:list', categories || [], 60_000);

    // 3. Preload featured products (for homepage hero/featured section)
    const [featured]: any = await pool.query(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.featured = true
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    const formattedFeatured = (featured || []).map((product: any) => ({
      ...product,
      images: parseImages(product.images),
    }));

    setCached('products:featured', formattedFeatured, 60_000);

    const duration = Date.now() - startTime;
    console.log(
      `✅ Cache warmed in ${duration}ms — ` +
      `${formattedProducts.length} products, ` +
      `${(categories || []).length} categories, ` +
      `${formattedFeatured.length} featured items`
    );

    return { success: true, duration, itemsLoaded: formattedProducts.length + (categories || []).length };
  } catch (error) {
    console.error('❌ Cache warm failed:', error);
    return { success: false, error };
  }
}

/**
 * Optional: Schedule periodic cache refresh (every 60 seconds in production)
 * Call this if you want background cache updates without relying on API hits.
 */
export function startCacheRefreshInterval(intervalMs = 60_000) {
  setInterval(() => {
    warmCaches().catch(err => console.error('Periodic cache refresh failed:', err));
  }, intervalMs);

  console.log(`📅 Cache refresh scheduled every ${intervalMs / 1000}s`);
}
