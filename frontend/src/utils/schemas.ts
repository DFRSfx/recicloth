import { Product } from '../types';

const SITE_URL = 'https://recicloth.com';

// Organization / OnlineStore Schema
export const getOrganizationSchema = () => ({
  '@type': 'OnlineStore',
  '@id': `${SITE_URL}/#organization`,
  name: 'Recicloth',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/images/logo.svg`,
    width: 1472,
    height: 704,
  },
  description:
    'Loja online de roupa reciclada, upcycled e de segunda mão. ' +
    'Moda sustentável para homem e mulher, acessórios sustentáveis e peças únicas ' +
    'selecionadas com critério ambiental — entregue em toda a União Europeia.',
  email: 'recicloth1972@gmail.com',
  sameAs: ['https://www.instagram.com/recicloth.croche/'],
  hasMap: `${SITE_URL}/contacto`,
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Cartão de crédito, Multibanco',
  areaServed: {
    '@type': 'Country',
    name: 'Portugal',
  },
});

// WebSite Schema with SearchAction
export const getWebSiteSchema = () => ({
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'Recicloth',
  url: SITE_URL,
  inLanguage: 'pt-PT',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/loja?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

// LocalBusiness / OnlineStore Schema (used on Contact page)
export const getLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': `${SITE_URL}/#organization`,
  name: 'Recicloth',
  url: SITE_URL,
  image: `${SITE_URL}/images/logo.svg`,
  email: 'recicloth1972@gmail.com',
  description:
    'Loja online de roupa reciclada e moda sustentável. ' +
    'Peças de segunda mão, upcycled e recicladas para homem e mulher, ' +
    'selecionadas com critério e entregues em toda a União Europeia.',
  areaServed: {
    '@type': 'Country',
    name: 'Portugal',
  },
  sameAs: ['https://www.instagram.com/recicloth.croche/'],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'recicloth1972@gmail.com',
    contactType: 'customer service',
    areaServed: 'PT',
    availableLanguage: ['Portuguese'],
  },
});

// Product Schema
export const getProductSchema = (product: Product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  '@id': `${SITE_URL}/produto/${product.id}`,
  name: product.name,
  description: product.description,
  image: product.images.map(img =>
    img.startsWith('http') ? img : `${SITE_URL}${img}`
  ),
  sku: product.id,
  brand: {
    '@type': 'Brand',
    name: 'Recicloth',
  },
  manufacturer: {
    '@type': 'Organization',
    name: 'Recicloth',
    url: SITE_URL,
  },
  offers: {
    '@type': 'Offer',
    url: `${SITE_URL}/produto/${product.id}`,
    priceCurrency: 'EUR',
    price: product.price.toFixed(2),
    availability: product.inStock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: 'Recicloth',
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'PT',
      },
    },
  },
  category: product.category,
  additionalProperty: [
    {
      '@type': 'PropertyValue',
      name: 'Sustentável',
      value: 'Sim',
    },
    {
      '@type': 'PropertyValue',
      name: 'País de Origem',
      value: 'Portugal',
    },
  ],
});

// Breadcrumb Schema
export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.url}`,
  })),
});

// FAQ Schema
export const getFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

// ItemList Schema for Shop page
export const getItemListSchema = (products: Product[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Roupa Reciclada e Moda Sustentável — Recicloth',
  description: 'Roupa reciclada, upcycled e de segunda mão para homem e mulher. Acessórios sustentáveis selecionados com critério ambiental.',
  itemListElement: products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/produto/${product.id}`,
    name: product.name,
  })),
});

// Homepage FAQ content — answers target long-tail search queries
export const getHomepageFAQs = () => [
  {
    question: 'O que é roupa reciclada e como é diferente de roupa de segunda mão?',
    answer:
      'Roupa reciclada refere-se a peças feitas a partir de materiais reutilizados ou transformados. ' +
      'Roupa de segunda mão é vestuário usado que é revendido no seu estado original. ' +
      'Na Recicloth encontra ambos os tipos, além de peças upcycled — artigos transformados criativamente para lhes dar uma nova função ou estética.',
  },
  {
    question: 'Como garantem a qualidade das peças de roupa reciclada?',
    answer:
      'Cada artigo da Recicloth é inspecionado individualmente antes de ser listado. ' +
      'Verificamos o estado geral, a ausência de danos significativos e a higiene da peça. ' +
      'O estado é sempre descrito honestamente na ficha do produto — "Bom estado", "Como novo", etc.',
  },
  {
    question: 'Fazem entregas em toda a União Europeia?',
    answer:
      'Sim! Entregamos em todos os países da União Europeia. ' +
      'Envios para Portugal continental têm custo reduzido (€3,99) com entrega em 2-3 dias úteis. ' +
      'Para o resto da UE o custo é €8,99 com entrega em 5-10 dias úteis. Portes grátis em compras acima de €75.',
  },
  {
    question: 'Qual é a política de devolução da Recicloth?',
    answer:
      'Tem 14 dias a partir da receção para devolver qualquer artigo, desde que nas mesmas condições em que foi recebido. ' +
      'Consulte a nossa Política de Devoluções para mais detalhes sobre o processo e condições.',
  },
  {
    question: 'Comprar roupa reciclada faz realmente diferença para o ambiente?',
    answer:
      'Sim. A produção de uma única t-shirt nova pode consumir até 2.700 litros de água. ' +
      'Ao escolher roupa reciclada ou de segunda mão, está a evitar essa pegada hídrica e a reduzir as emissões de CO₂ associadas à produção têxtil. ' +
      'Cada compra na Recicloth é uma ação concreta pela moda circular.',
  },
];
