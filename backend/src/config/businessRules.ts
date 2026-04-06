// ---------------------------------------------------------------------------
// CTT Country Table — dimensions per country (CTT Feb 2026 tariff)
// ---------------------------------------------------------------------------
export interface CTTCountry {
  name: string;
  maxDimCm: number; // largest single dimension limit
}

export const CTT_COUNTRIES: Record<string, CTTCountry> = {
  // --- Portugal (national) ---
  PT: { name: "Portugal",            maxDimCm: 150 },

  // --- EU / Zone 1 ---
  DE: { name: "Alemanha",            maxDimCm: 150 },
  AT: { name: "Áustria",             maxDimCm: 105 },
  BE: { name: "Bélgica",             maxDimCm: 150 },
  BG: { name: "Bulgária",            maxDimCm: 150 },
  CY: { name: "Chipre",              maxDimCm: 105 },
  HR: { name: "Croácia",             maxDimCm: 150 },
  DK: { name: "Dinamarca",           maxDimCm: 105 },
  SK: { name: "Eslováquia",          maxDimCm: 150 },
  SI: { name: "Eslovénia",           maxDimCm: 200 },
  ES: { name: "Espanha",             maxDimCm: 105 },
  EE: { name: "Estónia",             maxDimCm: 150 },
  FI: { name: "Finlândia",           maxDimCm: 150 },
  FR: { name: "França",              maxDimCm: 200 },
  GR: { name: "Grécia",              maxDimCm: 150 },
  HU: { name: "Hungria",             maxDimCm: 200 },
  IE: { name: "Irlanda",             maxDimCm: 150 },
  IT: { name: "Itália",              maxDimCm: 150 },
  LV: { name: "Letónia",             maxDimCm: 150 },
  LT: { name: "Lituânia",            maxDimCm: 150 },
  LU: { name: "Luxemburgo",          maxDimCm: 200 },
  MT: { name: "Malta",               maxDimCm: 105 },
  NL: { name: "Países Baixos",       maxDimCm: 150 },
  PL: { name: "Polónia",             maxDimCm: 105 },
  CZ: { name: "Chéquia",             maxDimCm: 105 },
  RO: { name: "Roménia",             maxDimCm: 105 },
  SE: { name: "Suécia",              maxDimCm: 150 },
};

// ---------------------------------------------------------------------------
// CTT Price Tables (EUR, Feb 2026)
// ---------------------------------------------------------------------------
export interface CTTPriceTier {
  maxWeightKg: number;
  price: number;
}

export const CTT_PRICES_PT: CTTPriceTier[] = [
  { maxWeightKg: 0.02, price: 1.58 },
  { maxWeightKg: 0.05, price: 1.58 },
  { maxWeightKg: 0.10, price: 1.58 },
  { maxWeightKg: 0.50, price: 2.34 },
  { maxWeightKg: 2.00, price: 5.55 },
];

export const CTT_PRICES_EU: CTTPriceTier[] = [
  { maxWeightKg: 0.02, price: 2.65  },
  { maxWeightKg: 0.05, price: 2.65  },
  { maxWeightKg: 0.10, price: 2.65  },
  { maxWeightKg: 0.25, price: 4.25  },
  { maxWeightKg: 0.50, price: 7.05  },
  { maxWeightKg: 1.00, price: 10.85 },
  { maxWeightKg: 2.00, price: 18.47 },
];

// ---------------------------------------------------------------------------
// Business Rules
// ---------------------------------------------------------------------------
export const BUSINESS_RULES = {
  VAT_RATE: 0.23,
  FREE_SHIPPING_THRESHOLD: 75,

  // Default item weight used when products don't have explicit weight data.
  // Typical clothing item (hoody/jacket) ≈ 0.4 kg.
  DEFAULT_ITEM_WEIGHT_KG: 0.4,

  SHIPPING: {
    // Derived from CTT_COUNTRIES so there is a single source of truth.
    ELIGIBLE_COUNTRIES: Object.keys(CTT_COUNTRIES),
    DAYS: {
      PT: '2-3 dias úteis',
      EU: '5-10 dias úteis',
    },
  },

  ORDER_STATUSES: ['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado'],
  RETURN_POLICY_DAYS: 14,
  CURRENCY: 'EUR',
} as const;

export const ORDER_STATUS_MAP = {
  Pendente:  'pending',
  Pago:      'processing',
  Enviado:   'shipped',
  Entregue:  'delivered',
  Cancelado: 'cancelled',
} as const;

export type OrderStatusLabel = keyof typeof ORDER_STATUS_MAP;
