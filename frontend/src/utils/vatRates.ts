// EU standard VAT rates by country code (ISO 3166-1 alpha-2)
// Source: European Commission — rates in effect April 2026
export const EU_VAT_RATES: Record<string, number> = {
  AT: 0.20, // Austria
  BE: 0.21, // Belgium
  BG: 0.20, // Bulgaria
  CY: 0.19, // Cyprus
  CZ: 0.21, // Czech Republic
  DE: 0.19, // Germany
  DK: 0.25, // Denmark
  EE: 0.22, // Estonia
  ES: 0.21, // Spain
  FI: 0.25, // Finland
  FR: 0.20, // France
  GR: 0.24, // Greece
  HR: 0.25, // Croatia
  HU: 0.27, // Hungary
  IE: 0.23, // Ireland
  IT: 0.22, // Italy
  LT: 0.21, // Lithuania
  LU: 0.17, // Luxembourg
  LV: 0.21, // Latvia
  MT: 0.18, // Malta
  NL: 0.21, // Netherlands
  PL: 0.23, // Poland
  PT: 0.23, // Portugal
  RO: 0.19, // Romania
  SE: 0.25, // Sweden
  SI: 0.22, // Slovenia
  SK: 0.20, // Slovakia
};

/** Returns the standard VAT rate for the given country, defaulting to PT (23%). */
export const getVatRate = (country: string): number =>
  EU_VAT_RATES[country?.toUpperCase()] ?? 0.23;
