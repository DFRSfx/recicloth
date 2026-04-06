import { useState, useEffect } from 'react';

// Module-level cache and in-flight deduplication — shared across all hook instances
let geoCache: string | null = null;
let geoInflight: Promise<string> | null = null;

/**
 * Detects the user's country from their IP (server-side lookup, no browser permission needed).
 * Falls back to 'PT' if the request fails or the country is unsupported.
 * Result is cached at module level — only one network request is ever made per page load.
 */
export function useGeoCountry(defaultCountry = 'PT'): string {
  const [country, setCountry] = useState(geoCache ?? defaultCountry);

  useEffect(() => {
    if (geoCache) {
      setCountry(geoCache);
      return;
    }
    if (!geoInflight) {
      geoInflight = fetch('/api/geo/country')
        .then(r => r.json())
        .then(data => {
          geoCache = data.country || defaultCountry;
          geoInflight = null;
          return geoCache as string;
        })
        .catch(() => {
          geoInflight = null;
          return defaultCountry;
        });
    }
    geoInflight.then(c => setCountry(c));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return country;
}
