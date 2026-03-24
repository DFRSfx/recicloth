/**
 * Adds cache busting parameter to image URLs to force browser to reload
 * @param imageUrl - The image URL (can be relative or absolute)
 * @param forceBust - If true, adds timestamp. If false, returns original URL
 * @returns URL with cache busting parameter
 */
export const addCacheBusting = (imageUrl: string, forceBust: boolean = false): string => {
  if (!imageUrl) return '';

  // If forceBust is false, return original URL (useful for initial loads)
  if (!forceBust) return imageUrl;

  // Check if URL already has query parameters
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}t=${Date.now()}`;
};

/**
 * Creates a cache busting key that changes when needed
 * Use this for component keys to force re-render when images update
 */
export const getImageCacheKey = (): number => {
  return Date.now();
};

/**
 * Returns the image URL ready to use in <img src>.
 * - Absolute URLs are returned as-is.
 * - Relative paths (e.g. /produtos/1/image-1-1.webp) are prefixed with the
 *   backend origin so they work even when the frontend is on a different domain.
 *   In dev, VITE_API_URL can be http://localhost:3001.
 *   In Vercel monodeploy, leave VITE_API_URL empty and this uses same-domain paths.
 */
/**
 * Returns the URL for a specific size variant of a product image.
 * - 'lg': original path (max 1200 px) — product detail page
 * - 'md': medium (max 600 px)         — shop grid / modals
 * - 'sm': small (max 280 px)          — thumbnails, cart, admin previews
 *
 * Falls back gracefully to the original path for images that pre-date the
 * multi-variant system (the browser will just load the full-size file).
 */
export const imgVariant = (imagePath: string, variant: 'sm' | 'md' | 'lg'): string => {
  if (!imagePath || variant === 'lg') return imagePath;
  return imagePath.replace(/\.webp$/, `-${variant}.webp`);
};

export const getAbsoluteImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';

  // Already absolute
  if (imageUrl.startsWith('http')) return imageUrl;

  // Use same domain when VITE_API_URL is empty (recommended for Vercel monodeploy).
  const backendOrigin = import.meta.env.VITE_API_URL?.trim();
  return backendOrigin ? `${backendOrigin}${imageUrl}` : imageUrl;
};
