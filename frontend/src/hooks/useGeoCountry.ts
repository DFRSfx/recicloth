import { useState, useEffect } from 'react';

/**
 * Detects the user's country from their IP (server-side lookup, no browser permission needed).
 * Falls back to 'PT' if the request fails or the country is unsupported.
 */
export function useGeoCountry(defaultCountry = 'PT'): string {
  const [country, setCountry] = useState(defaultCountry);

  useEffect(() => {
    fetch('/api/geo/country')
      .then(r => r.json())
      .then(data => { if (data.country) setCountry(data.country); })
      .catch(() => {}); // silent fallback to default
  }, []);

  return country;
}
