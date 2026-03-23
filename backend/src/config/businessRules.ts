export const BUSINESS_RULES = {
  VAT_RATE: 0.23,
  FREE_SHIPPING_THRESHOLD: 75,
  SHIPPING: {
    PT: { cost: 3.99, days: '2-3 dias uteis' },
    EU: { cost: 8.99, days: '5-10 dias uteis' },
    ELIGIBLE_COUNTRIES: [
      'PT', 'ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK', 'FI',
      'IE', 'GR', 'CZ', 'RO', 'HU', 'SK', 'BG', 'HR', 'SI', 'LT', 'LV', 'EE',
      'CY', 'LU', 'MT'
    ]
  },
  ORDER_STATUSES: ['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado'],
  RETURN_POLICY_DAYS: 14,
  CURRENCY: 'EUR'
} as const;

export const ORDER_STATUS_MAP = {
  Pendente: 'pending',
  Pago: 'processing',
  Enviado: 'shipped',
  Entregue: 'delivered',
  Cancelado: 'cancelled'
} as const;

export type OrderStatusLabel = keyof typeof ORDER_STATUS_MAP;
