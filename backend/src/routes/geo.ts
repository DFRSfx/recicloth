import express from 'express';
import geoip from 'geoip-lite';
import { CTT_COUNTRIES } from '../config/businessRules.js';

const router = express.Router();

/** Extracts the real client IP, accounting for reverse proxies (Vercel, Nginx, etc.) */
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return first.trim();
  }
  return req.socket.remoteAddress ?? '';
}

/**
 * GET /api/geo/country
 * Returns the ISO country code derived from the request IP.
 * Falls back to 'PT' if lookup fails or country is not in our shipping list.
 */
router.get('/country', (req, res) => {
  const ip = getClientIp(req);
  const geo = geoip.lookup(ip);
  const detected = geo?.country ?? 'PT';
  // Only use detected country if we actually ship there; otherwise default to PT
  const country = CTT_COUNTRIES[detected] ? detected : 'PT';
  res.json({ country });
});

export default router;
