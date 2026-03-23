// Type adapters to convert backend types to frontend types

import { Product as FrontendProduct } from '../types';

// Backend product type (from API)
// Note: MySQL returns some fields as strings that need conversion
export interface BackendProduct {
  id: number;
  name: string;
  description: string;
  price: number | string; // MySQL DECIMAL comes as string
  category_id: number;
  category_name?: string;
  category_slug?: string;
  images?: string[]; // Array of image file paths (e.g. ["/public/produtos/1/image-1-1.webp"])
  colors?: string[] | string; // JSON field, array of color names
  stock: number | string; // May come as string
  featured: boolean | number; // MySQL BOOLEAN (TINYINT) comes as 0/1
  created_at: string;
  updated_at: string;
}

// Backend category type (from API)
export interface BackendCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

// Convert backend product to frontend product
export function adaptProductToFrontend(backendProduct: BackendProduct): FrontendProduct {
  // Images are stored as files on disk; backend sends paths like ['/public/produtos/1/image-1-1.webp']
  let images: string[] = [];
  if (backendProduct.images && Array.isArray(backendProduct.images)) {
    images = backendProduct.images;
  }

  // Ensure images is always an array with at least one element
  if (!Array.isArray(images) || images.length === 0) {
    images = ['/images/placeholder.jpg'];
  }

  // Ensure price is a number
  const price = typeof backendProduct.price === 'string'
    ? parseFloat(backendProduct.price)
    : backendProduct.price;

  // Ensure stock is a number
  const stock = typeof backendProduct.stock === 'string'
    ? parseInt(backendProduct.stock, 10)
    : backendProduct.stock;

  // Ensure featured is a boolean
  const featured = typeof backendProduct.featured === 'number'
    ? backendProduct.featured === 1
    : Boolean(backendProduct.featured);

  // Calculate if product is new (created within last 7 days)
  const createdAt = new Date(backendProduct.created_at);
  const today = new Date();
  const daysDifference = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const isNew = daysDifference <= 7;

  // Parse colors if it's a JSON string
  let colorsArray: string[] = [];
  if (backendProduct.colors) {
    if (typeof backendProduct.colors === 'string') {
      try {
        const parsed = JSON.parse(backendProduct.colors);
        colorsArray = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse colors JSON:', e);
        colorsArray = [];
      }
    } else if (Array.isArray(backendProduct.colors)) {
      colorsArray = backendProduct.colors;
    }
  }

  return {
    id: backendProduct.id.toString(),
    name: backendProduct.name,
    description: backendProduct.description,
    price: price,
    images: images,
    category: backendProduct.category_name || 'Sem Categoria',
    colors: colorsArray,
    inStock: stock > 0,
    featured: featured,
    new: isNew,
    tags: [], // TODO: Add tags support in backend
    stock: stock, // Add stock info for favorites page
  };
}

// Convert array of backend products to frontend products
export function adaptProductsToFrontend(backendProducts: BackendProduct[]): FrontendProduct[] {
  return backendProducts.map(adaptProductToFrontend);
}

// Frontend category type
export interface FrontendCategory {
  id: number;
  name: string;
  slug: string;
  image: string;
  description: string;
}

// Convert backend category to frontend category
export function adaptCategoryToFrontend(backendCategory: BackendCategory): FrontendCategory {
  return {
    id: backendCategory.id,
    name: backendCategory.name,
    slug: backendCategory.slug,
    image: backendCategory.image || '/images/placeholder.jpg',
    description: backendCategory.description || '',
  };
}

// Convert array of backend categories to frontend categories
export function adaptCategoriesToFrontend(backendCategories: BackendCategory[]): FrontendCategory[] {
  return backendCategories.map(adaptCategoryToFrontend);
}
