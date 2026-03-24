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
    url: `${SITE_URL}/images/logo.png`,
    width: 1472,
    height: 704,
  },
  description:
    'Loja online de produtos em croché artesanais feitos à mão em Portugal. ' +
    'Malas de croché feitas à mão, acessórios de croché artesanais para oferecer e ' +
    'decoração de sala em croché artesanal de qualidade premium.',
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
  image: `${SITE_URL}/images/logo.png`,
  email: 'recicloth1972@gmail.com',
  description:
    'Loja online de malas de croché feitas à mão em Portugal. ' +
    'Prendas artesanais para mulher, acessórios de croché artesanais para oferecer ' +
    'e decoração de sala em croché artesanal de qualidade premium.',
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
      name: 'Feito à Mão',
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
  name: 'Produtos de Croché Artesanais — Recicloth',
  description: 'Malas de croché feitas à mão, acessórios de croché artesanais para oferecer e decoração em croché artesanal produzidos em Portugal.',
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
    question: 'Posso encomendar uma bolsa de croché personalizada em Portugal?',
    answer:
      'Sim. Na Recicloth aceitamos encomendas personalizadas de bolsas de croché feitas à mão em Portugal. ' +
      'Pode escolher cores, dimensões e estilo. Entre em contacto connosco através da página de contacto para discutir a sua encomenda.',
  },
  {
    question: 'Quanto tempo demora a criar uma peça de croché artesanal?',
    answer:
      'Cada peça de croché artesanal leva entre 8 a 15 horas de trabalho manual, dependendo da complexidade do padrão e das dimensões. ' +
      'É este cuidado e dedicação que torna cada criação da Recicloth verdadeiramente única.',
  },
  {
    question: 'Os produtos são feitos em Portugal?',
    answer:
      'Sim, todos os produtos da Recicloth são produzidos em Portugal com materiais de alta qualidade. ' +
      'Ao comprar na nossa loja está a apoiar o artesanato português e a adquirir peças com autenticidade e origem garantida.',
  },
  {
    question: 'Os acessórios de croché artesanais são uma boa prenda para mulher?',
    answer:
      'Absolutamente. As nossas prendas artesanais para mulher feitas à mão — bolsas, acessórios e decoração em croché — ' +
      'são presentes originais e únicos para aniversários, Natal, Dia dos Namorados ou simplesmente para surpreender alguém especial. ' +
      'Cada peça é embalada com cuidado e chega pronta a oferecer.',
  },
  {
    question: 'A decoração de sala em croché artesanal é resistente para uso diário?',
    answer:
      'Sim. Utilizamos fios de alta qualidade selecionados para durabilidade e beleza. ' +
      'A decoração de sala em croché artesanal da Recicloth é criada para durar anos, mantendo as cores e a forma com cuidados básicos de manutenção.',
  },
];
