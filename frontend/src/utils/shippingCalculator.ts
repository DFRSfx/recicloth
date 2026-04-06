// Mirrors backend businessRules — keep in sync if values change
const FREE_SHIPPING_THRESHOLD = 75;
const DEFAULT_ITEM_WEIGHT_KG = 0.4;

const CTT_PRICES_PT = [
  { maxWeightKg: 0.02, price: 1.58 },
  { maxWeightKg: 0.05, price: 1.58 },
  { maxWeightKg: 0.10, price: 1.58 },
  { maxWeightKg: 0.50, price: 2.34 },
  { maxWeightKg: 2.00, price: 5.55 },
];

const CTT_PRICES_EU = [
  { maxWeightKg: 0.02, price: 2.65 },
  { maxWeightKg: 0.05, price: 2.65 },
  { maxWeightKg: 0.10, price: 2.65 },
  { maxWeightKg: 0.25, price: 4.25 },
  { maxWeightKg: 0.50, price: 7.05 },
  { maxWeightKg: 1.00, price: 10.85 },
  { maxWeightKg: 2.00, price: 18.47 },
];

/** EU countries supported for delivery (ISO → display name) */
export const EU_SHIPPING_COUNTRIES: Record<string, string> = {
  PT: "Portugal",
  DE: "Alemanha",
  AT: "Áustria",
  BE: "Bélgica",
  BG: "Bulgária",
  CY: "Chipre",
  HR: "Croácia",
  DK: "Dinamarca",
  SK: "Eslováquia",
  SI: "Eslovénia",
  ES: "Espanha",
  EE: "Estónia",
  FI: "Finlândia",
  FR: "França",
  GR: "Grécia",
  HU: "Hungria",
  IE: "Irlanda",
  IT: "Itália",
  LV: "Letónia",
  LT: "Lituânia",
  LU: "Luxemburgo",
  MT: "Malta",
  NL: "Países Baixos",
  PL: "Polónia",
  CZ: "Chéquia",
  RO: "Roménia",
  SE: "Suécia",
};

/**
 * Calculate CTT shipping cost.
 * @param country   ISO 3166-1 alpha-2 (e.g. 'PT', 'FR')
 * @param itemCount Total quantity of items in order
 * @param total     Order total including VAT (compared against free shipping threshold)
 */
export function calcShipping(country: string, itemCount: number, total: number): number {
  if (total >= FREE_SHIPPING_THRESHOLD) return 0;
  const weightKg = itemCount * DEFAULT_ITEM_WEIGHT_KG;
  const table = country.toUpperCase() === 'PT' ? CTT_PRICES_PT : CTT_PRICES_EU;
  const tier = table.find(t => weightKg <= t.maxWeightKg) ?? table[table.length - 1];
  return tier.price;
}

export { FREE_SHIPPING_THRESHOLD };
