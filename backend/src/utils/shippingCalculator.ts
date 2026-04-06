import {
  CTT_COUNTRIES,
  CTT_PRICES_PT,
  CTT_PRICES_EU,
  BUSINESS_RULES,
} from '../config/businessRules.js';

export interface ShippingResult {
  cost: number;
  isFree: boolean;
  weightKg: number;
  country: string;
  zone: 'PT' | 'EU';
}

/**
 * Calculates CTT shipping cost based on destination country, item count, and subtotal.
 *
 * Uses DEFAULT_ITEM_WEIGHT_KG per item when products don't carry explicit weights.
 * Returns 0 if subtotal meets FREE_SHIPPING_THRESHOLD.
 *
 * @param countryCode  ISO 3166-1 alpha-2 (e.g. "PT", "FR")
 * @param itemCount    Total number of items (sum of quantities)
 * @param subtotal     Order subtotal before VAT and shipping (EUR)
 * @param itemWeightKg Optional per-item weight override; defaults to DEFAULT_ITEM_WEIGHT_KG
 */
export function calculateShipping(
  countryCode: string,
  itemCount: number,
  subtotal: number,
  itemWeightKg?: number
): ShippingResult {
  const iso = countryCode.toUpperCase();
  const country = CTT_COUNTRIES[iso];

  if (!country) {
    throw new Error(`País "${countryCode}" não suportado para envio.`);
  }

  const zone: 'PT' | 'EU' = iso === 'PT' ? 'PT' : 'EU';

  if (subtotal >= BUSINESS_RULES.FREE_SHIPPING_THRESHOLD) {
    return { cost: 0, isFree: true, weightKg: 0, country: country.name, zone };
  }

  const perItemKg = itemWeightKg ?? BUSINESS_RULES.DEFAULT_ITEM_WEIGHT_KG;
  const totalWeightKg = parseFloat((itemCount * perItemKg).toFixed(3));

  const table = zone === 'PT' ? CTT_PRICES_PT : CTT_PRICES_EU;
  const tier = table.find(t => totalWeightKg <= t.maxWeightKg);

  if (!tier) {
    // Weight exceeds 2 kg — use the highest tier as a fallback.
    const maxTier = table[table.length - 1];
    return { cost: maxTier.price, isFree: false, weightKg: totalWeightKg, country: country.name, zone };
  }

  return { cost: tier.price, isFree: false, weightKg: totalWeightKg, country: country.name, zone };
}
