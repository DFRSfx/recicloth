export type PaymentMethodLabelLocale = 'pt' | 'en';

const normalizePaymentMethod = (method?: string | null): string | undefined => {
  if (!method) return undefined;
  return method.toLowerCase().replace(/[\s-]/g, '_');
};

export const getPaymentMethodLabel = (
  method?: string | null,
  locale: PaymentMethodLabelLocale = 'pt'
): string => {
  const normalized = normalizePaymentMethod(method);
  switch (normalized) {
    case 'mbway':
    case 'mb_way':
      return 'MB WAY';
    case 'multibanco':
      return 'Multibanco';
    case 'card':
    case 'stripe':
      return locale === 'en' ? 'Debit/Credit card' : 'Cartão de débito/crédito';
    default:
      return method ?? '—';
  }
};
