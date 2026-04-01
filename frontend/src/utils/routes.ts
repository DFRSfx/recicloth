export type Lang = 'pt' | 'en';

type RouteKey =
  | 'home'
  | 'shop'
  | 'shopCategory'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'checkoutSuccess'
  | 'checkoutFail'
  | 'contact'
  | 'profile'
  | 'orders'
  | 'favorites'
  | 'verifyEmail'
  | 'resetPassword'
  | 'trackOrder'
  | 'privacyPolicy'
  | 'returnPolicy'
  | 'terms';

export const routeMap: Record<RouteKey, { pt: string; en: string }> = {
  home: { pt: '/', en: '/' },
  shop: { pt: '/loja', en: '/shop' },
  shopCategory: { pt: '/loja/:categorySlug', en: '/shop/:categorySlug' },
  product: { pt: '/produto/:id', en: '/product/:id' },
  cart: { pt: '/carrinho', en: '/cart' },
  checkout: { pt: '/finalizar-compra', en: '/checkout' },
  checkoutSuccess: { pt: '/checkout/success', en: '/checkout/success' },
  checkoutFail: { pt: '/checkout/fail', en: '/checkout/fail' },
  contact: { pt: '/contacto', en: '/contact' },
  profile: { pt: '/perfil', en: '/profile' },
  orders: { pt: '/encomendas', en: '/orders' },
  favorites: { pt: '/favoritos', en: '/favorites' },
  verifyEmail: { pt: '/verificar-email', en: '/verify-email' },
  resetPassword: { pt: '/redefinir-senha', en: '/reset-password' },
  trackOrder: { pt: '/track-order/:token', en: '/track-order/:token' },
  privacyPolicy: { pt: '/politica-privacidade', en: '/privacy-policy' },
  returnPolicy: { pt: '/politica-devolucao', en: '/return-policy' },
  terms: { pt: '/termos-condicoes', en: '/terms-conditions' },
};

const replaceParams = (path: string, params: Record<string, string | number>) => {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, encodeURIComponent(String(value))),
    path
  );
};

export const getRoutePath = (key: RouteKey, lang: Lang) => routeMap[key][lang];

export const getRoutePathWithParams = (
  key: RouteKey,
  lang: Lang,
  params: Record<string, string | number>
) => replaceParams(getRoutePath(key, lang), params);

export const withQuery = (
  path: string,
  query?: Record<string, string | number | undefined | null>
) => {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
};

export const getShopPath = (lang: Lang, categorySlug?: string) => {
  if (!categorySlug) return getRoutePath('shop', lang);
  return getRoutePathWithParams('shopCategory', lang, { categorySlug });
};

export const getProductPath = (lang: Lang, id: string | number) =>
  getRoutePathWithParams('product', lang, { id });

export const getTrackOrderPath = (lang: Lang, token: string) =>
  getRoutePathWithParams('trackOrder', lang, { token });

export const getRoutePrefixes = (key: RouteKey) => {
  const { pt, en } = routeMap[key];
  return pt === en ? [pt] : [pt, en];
};

export const isRouteMatch = (pathname: string, key: RouteKey) => {
  const prefixes = getRoutePrefixes(key);
  return prefixes.some((prefix) => (prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)));
};
